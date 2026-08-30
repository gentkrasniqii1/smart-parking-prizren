import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t px-4 py-6 text-xs text-muted-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p>
          Të dhënat e hartës &copy;{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            kontribues OpenStreetMap
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/gentkrasniqii1/smart-parking-prizren"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            GitHub
            <ExternalLink className="size-3" />
          </a>
          <a
            href="https://gent-portfolio.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Portofoli
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
