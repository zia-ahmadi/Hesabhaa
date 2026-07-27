export type Locale = "en" | "fa";

export const defaultLocale: Locale = "fa";

export const getLocale = (lang?: string): Locale => {
  if (lang === "en") return "en";
  return defaultLocale;
};

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    siteName: "Bastaha Market",
    homeTitle: "Authentic shopping for everyday needs",
    homeDescription:
      "A simple, responsive marketplace built with Next.js, Tailwind CSS, Prisma, and NextAuth.",
    browseProducts: "Browse products",
    productsTitle: "Products",
    productDetails: "Product details",
    productDescription: "Description",
    price: "Price",
    viewDetails: "View details",
    login: "Login",
    register: "Register",
    profile: "Profile",
    logout: "Logout",
    orderHistory: "Order history",
    noOrders: "No orders yet.",
    name: "Name",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    signIn: "Sign in",
    orderStatus: "Status",
    quantity: "Quantity",
    total: "Total",
    home: "Home",
    language: "فارسی",
  },
  fa: {
    siteName: "بازار بستها",
    homeTitle: "خرید ساده و اصیل برای نیازهای روزانه",
    homeDescription:
      "یک مارکت‌پلیس پاسخگو با Next.js، Tailwind CSS، Prisma و NextAuth.",
    browseProducts: "مشاهده محصولات",
    productsTitle: "محصولات",
    productDetails: "جزئیات محصول",
    productDescription: "توضیحات",
    price: "قیمت",
    viewDetails: "مشاهده",
    login: "ورود",
    register: "ثبت‌نام",
    profile: "پروفایل",
    logout: "خروج",
    orderHistory: "سابقه سفارش‌ها",
    noOrders: "هنوز سفارشی ثبت نشده.",
    name: "نام",
    email: "ایمیل",
    password: "رمز عبور",
    createAccount: "ایجاد حساب",
    signIn: "ورود",
    orderStatus: "وضعیت",
    quantity: "تعداد",
    total: "جمع",
    home: "خانه",
    language: "English",
  },
};
