'use client'; // Marca como componente client-side

import { useState, FormEvent } from 'react'; // Importa hooks React
import { motion, AnimatePresence } from 'framer-motion'; // Importa animações Framer Motion

interface Product { // Interface para produto
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface FormData { // Interface para dados do cliente
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export default function Home() { // Componente principal
  const [products, setProducts] = useState<Product[]>([]); // Estado para lista de produtos
  const [productForm, setProductForm] = useState({ name: '', price: '', quantity: '1' }); // Estado para form de produto
  const [customerForm, setCustomerForm] = useState<FormData>({ // Estado para form de cliente
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  });
  const [loading, setLoading] = useState<boolean>(false); // Estado de loading
  const [error, setError] = useState<string | null>(null); // Estado de erro
  const [success, setSuccess] = useState<string | null>(null); // Estado de sucesso

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'; // URL backend de env

  const handleProductChange = (e: FormEvent<HTMLInputElement>) => { // Handler para mudança em input de produto
    const { name, value } = e.currentTarget;
    setProductForm({ ...productForm, [name]: value }); // Atualiza estado
  };

  const handleCustomerChange = (e: FormEvent<HTMLInputElement>) => { // Handler para mudança em input de cliente
    const { name, value } = e.currentTarget;
    setCustomerForm({ ...customerForm, [name]: value }); // Atualiza estado
  };

  const addProduct = (e: FormEvent<HTMLFormElement>) => { // Adiciona produto ao carrinho
    e.preventDefault(); // Previne reload
    if (!productForm.name || !productForm.price || !productForm.quantity) { // Valida campos
      setError('Preencha todos os campos do produto.');
      return;
    }
    setProducts([ // Adiciona novo produto
      ...products,
      {
        id: Date.now(), // ID único baseado em timestamp
        name: productForm.name,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
      },
    ]);
    setProductForm({ name: '', price: '', quantity: '1' }); // Reseta form
    setError(null); // Limpa erro
  };

  const removeProduct = (id: number) => { // Remove produto por ID
    setProducts(products.filter((product) => product.id !== id)); // Filtra lista
  };

  const calculateTotal = () => { // Calcula total do carrinho
    return products.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2); // Soma preços
  };

  const handleCheckout = async (e: FormEvent<HTMLFormElement>) => { // Inicia checkout
    e.preventDefault(); // Previne reload
    if (products.length === 0) { // Valida carrinho
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }
    if (!customerForm.customer_name || !customerForm.customer_email) { // Valida cliente
      setError('Preencha os dados do cliente.');
      return;
    }

    setLoading(true); // Ativa loading
    setError(null); // Limpa erro
    setSuccess(null); // Limpa sucesso

    try {
      const response = await fetch(`${backendUrl}/api/initiate-payment`, { // Fetch para backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ // Body com dados, incluindo products para DB
          customer_name: customerForm.customer_name,
          customer_email: customerForm.customer_email,
          customer_phone: customerForm.customer_phone,
          amount: parseFloat(calculateTotal()),
          details: `Compra de ${products.length} produto(s)`,
          currency: 'AOA',
          identifier: `ORDER_${Date.now()}`,
          ipn_url: `${backendUrl}/api/ipn`, // IPN aponta para backend
          success_url: 'http://localhost:3001/success',
          cancel_url: 'http://localhost:3001/cancel',
          site_logo: 'https://your-site.com/logo.png',
          checkout_theme: 'light',
          products: products, // Envia produtos para armazenamento no DB
        }),
      });

      const data = await response.json(); // Parseia resposta
      if (data.success === 'ok') { // Se sucesso, redireciona
        setSuccess('Pagamento iniciado! Redirecionando...');
        setTimeout(() => {
          window.location.href = data.url;
        }, 1500);
      } else { // Se erro, seta mensagem
        setError(data.message || 'Erro ao iniciar o pagamento');
      }
    } catch (err) { // Captura erros de rede
      setError('Erro ao processar o pagamento: ' + (err as Error).message);
    } finally {
      setLoading(false); // Desativa loading
    }
  };

  // JSX do componente (código fornecido, sem alterações além de handlers)
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-zinc-200 shadow-xl rounded-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8 flex items-center justify-between gap-4">
           Vendas Transmissiva
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
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ex: Computador"
                  autoComplete='off'
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
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  step="0.01"
                  placeholder="Ex: 5000.00"
                  required
                  autoComplete='off'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  name="quantity"
                  value={productForm.quantity}
                  onChange={handleProductChange}
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  min="1"
                  required
                  autoComplete='off'
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
                <p className="mt-4 text-lg font-semibold text-gray-800 text-right pr-4">
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
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  autoComplete='off'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  name="customer_email"
                  value={customerForm.customer_email}
                  onChange={handleCustomerChange}
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  autoComplete='off'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={customerForm.customer_phone}
                  autoComplete='off'
                  onChange={handleCustomerChange}
                  className="w-full p-3 border border-gray-400 text-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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