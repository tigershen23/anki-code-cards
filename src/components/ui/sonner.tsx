import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      duration={2000}
      icons={{
        success: <CircleCheckIcon className="size-4 text-ctp-green" />,
        info: <InfoIcon className="size-4 text-ctp-blue" />,
        warning: <TriangleAlertIcon className="size-4 text-ctp-yellow" />,
        error: <OctagonXIcon className="size-4 text-ctp-red" />,
        loading: <Loader2Icon className="size-4 animate-spin text-ctp-blue" />,
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
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
