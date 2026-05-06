// UI 统一规范配置
export const UI = {
  // 页面容器
  page: 'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50',
  container: 'max-w-4xl mx-auto px-4 py-8',
  containerWide: 'max-w-6xl mx-auto px-4 py-8',
  
  // 卡片
  card: 'bg-white rounded-xl shadow-sm border border-slate-100 p-6',
  cardHover: 'hover:shadow-md transition-all duration-200',
  
  // 按钮
  btnPrimary: 'px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all',
  btnSecondary: 'px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:bg-purple-700 transition-all',
  btnDanger: 'px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-all',
  btnSuccess: 'px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all',
  
  // 输入框
  input: 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none',
  
  // 提示
  error: 'mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm',
  success: 'mt-3 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm',
  warning: 'mt-3 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm',
  
  // 加载
  loading: 'animate-spin text-5xl mb-4',
  
  // 标题
  title: 'text-3xl font-bold text-slate-800 mb-6',
  subtitle: 'text-lg text-slate-500 mb-8',
}
