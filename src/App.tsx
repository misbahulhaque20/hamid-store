import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Public pages
import { HomePage } from '@/pages/HomePage'
import { BooksPage } from '@/pages/BooksPage'
import { BookDetailsPage } from '@/pages/BookDetailsPage'
import { AuthorPage } from '@/pages/AuthorPage'
import { ContactPage } from '@/pages/ContactPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { AccountPage } from '@/pages/AccountPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { OrderTrackingPage } from '@/pages/OrderTrackingPage'

// Admin pages
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminBooksPage } from '@/pages/admin/AdminBooksPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage'
import { AdminLedgerPage } from '@/pages/admin/AdminLedgerPage'
import { AdminStockPage } from '@/pages/admin/AdminStockPage'
import { AdminStoreSettingsPage } from '@/pages/admin/AdminStoreSettingsPage'
import { AdminAppearancePage } from '@/pages/admin/AdminAppearancePage'
import { AdminPaymentSettingsPage } from '@/pages/admin/AdminPaymentSettingsPage'
import { AdminDeliverySettingsPage } from '@/pages/admin/AdminDeliverySettingsPage'
import { AdminTelegramSettingsPage } from '@/pages/admin/AdminTelegramSettingsPage'
import { AdminEmailSettingsPage } from '@/pages/admin/AdminEmailSettingsPage'

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hamidstore-theme">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/book/:slug" element={<BookDetailsPage />} />
                <Route path="/author" element={<AuthorPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
              </Route>

              {/* Admin login */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="books" element={<AdminBooksPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="ledger" element={<AdminLedgerPage />} />
                <Route path="stock" element={<AdminStockPage />} />
                <Route path="settings/store" element={<AdminStoreSettingsPage />} />
                <Route path="settings/appearance" element={<AdminAppearancePage />} />
                <Route path="settings/payment" element={<AdminPaymentSettingsPage />} />
                <Route path="settings/delivery" element={<AdminDeliverySettingsPage />} />
                <Route path="settings/telegram" element={<AdminTelegramSettingsPage />} />
                <Route path="settings/email" element={<AdminEmailSettingsPage />} />
              </Route>
            </Routes>
            <Toaster position="top-center" richColors />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
