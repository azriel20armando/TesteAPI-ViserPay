'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface FormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState({ name: '', price: '', quantity: '1' });
  const [customerForm, setCustomerForm] = useState<FormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProductChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setProductForm({ ...productForm, [name]: value });
  };

  const handleCustomerChange = (e: FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setCustomerForm({ ...customerForm, [name]: value });
  };

  const addProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.quantity) {
      setError('Preencha todos os campos do produto.');
      return;
    }
    setProducts([
      ...products,
      {
        id: Date.now(),
        name: productForm.name,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
      },
    ]);
    setProductForm({ name: '', price: '', quantity: '1' });
    setError(null);
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter((product) => product.id !== id));
  };

  const calculateTotal = () => {
    return products.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2);
  };

  const handleCheckout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (products.length === 0) {
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }
    if (!customerForm.customer_name || !customerForm.customer_email) {
      setError('Preencha os dados do cliente.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3000/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerForm.customer_name,
          customer_email: customerForm.customer_email,
          customer_phone: customerForm.customer_phone,
          amount: parseFloat(calculateTotal()),
          details: `Compra de ${products.length} produto(s)`,
          currency: 'AOA',
          identifier: `ORDER_${Date.now()}`,
          ipn_url: 'http://your-site.com/api/ipn',
          success_url: 'http://localhost:3001/success',
          cancel_url: 'http://localhost:3001/cancel',
          site_logo: 'https://your-site.com/logo.png',
          checkout_theme: 'light',
        }),
      });

      const data = await response.json();
      if (data.success === 'ok') {
        setSuccess('Pagamento iniciado! Redirecionando...');
        setTimeout(() => {
          window.location.href = data.url;
        }, 1500);
      } else {
        setError(data.message || 'Erro ao iniciar o pagamento');
      }
    } catch (err) {
      setError('Erro ao processar o pagamento: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-4">
            E-commerce Transmissiva
            <img
              className="w-20"
              src="/LOGO_TRANSMISSIVA__Prancheta_1-removebg-preview.png"
              alt="Logo Transmissiva"
            />
          </h1>

          {/* Formulário de Produtos */}
          <form onSubmit={addProduct} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Adicionar Produto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ex: Camiseta"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (AOA)</label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  step="0.01"
                  placeholder="Ex: 5000.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  name="quantity"
                  value={productForm.quantity}
                  onChange={handleProductChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  min="1"
                  required
                />
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Adicionar ao Carrinho
            </motion.button>
          </form>

          {/* Lista de Produtos */}
          <AnimatePresence>
            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Carrinho</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left text-sm font-medium text-gray-700">Nome</th>
                        <th className="p-3 text-left text-sm font-medium text-gray-700">Preço</th>
                        <th className="p-3 text-left text-sm font-medium text-gray-700">Quantidade</th>
                        <th className="p-3 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="p-3 text-left text-sm font-medium text-gray-700">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-b"
                        >
                          <td className="p-3 text-gray-800">{product.name}</td>
                          <td className="p-3 text-gray-800">AOA {product.price.toFixed(2)}</td>
                          <td className="p-3 text-gray-800">{product.quantity}</td>
                          <td className="p-3 text-gray-800">AOA {(product.price * product.quantity).toFixed(2)}</td>
                          <td className="p-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeProduct(product.id)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              Remover
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-800 text-right">
                  Total: AOA {calculateTotal()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulário de Checkout */}
          <form onSubmit={handleCheckout}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados do Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  name="customer_name"
                  value={customerForm.customer_name}
                  onChange={handleCustomerChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="customer_email"
                  value={customerForm.customer_email}
                  onChange={handleCustomerChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={customerForm.customer_phone}
                  onChange={handleCustomerChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              className={`w-full p-3 rounded-lg text-white font-medium transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0l4 4-4 4z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                'Pagar com ViserPay'
              )}
            </motion.button>
          </form>

          {/* Mensagens de Feedback */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 text-red-600 text-center"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 text-green-600 text-center"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}