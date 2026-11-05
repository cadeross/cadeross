/* Re-mounts on every navigation, so each page arrives with the same short
   lift out of a blur while the field crosses to its colour. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
