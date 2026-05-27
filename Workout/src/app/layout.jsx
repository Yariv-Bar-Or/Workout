export const metadata = {
  title: 'Iron Log - מעקב אימונים',
  description: 'אפליקציית מעקב אימונים',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, backgroundColor: '#0f0f0f' }}>
        {children}
      </body>
    </html>
  )
}