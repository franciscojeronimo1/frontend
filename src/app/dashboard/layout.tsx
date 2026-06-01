import { Header } from "./components/header";
import { OrderProvider } from "@/providers/order";
import { NewOrderFab } from "./components/new-order-fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <OrderProvider>{children}</OrderProvider>
      <NewOrderFab />
    </>
  );
}
