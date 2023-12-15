import Header from "./Header";

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main className="pt-0">{children}</main>
    </>
  );
}
