import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      duration={1500}
      toastOptions={{
        style: {
          padding: "8px 12px",
          fontSize: "12px",
          minHeight: "auto",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#4c4f69",
          "--normal-border": "#ccd0da",
          "--success-bg": "#ffffff",
          "--success-text": "#40a02b",
          "--success-border": "#40a02b",
          "--error-bg": "#ffffff",
          "--error-text": "#d20f39",
          "--error-border": "#d20f39",
          "--border-radius": "4px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
