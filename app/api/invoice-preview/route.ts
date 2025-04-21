import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Obtener configuración de la consulta
    const url = new URL(req.url)
    const settings = url.searchParams.get("settings")

    if (!settings) {
      return NextResponse.json({ error: "Se requiere el parámetro settings" }, { status: 400 })
    }

    const parsedSettings = JSON.parse(settings)

    // Generar HTML para la vista previa
    const html = generateInvoicePreview(parsedSettings)

    // Devolver HTML
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error al generar vista previa:", error)
    return NextResponse.json({ error: "Error al generar vista previa" }, { status: 500 })
  }
}

function generateInvoicePreview(settings: any) {
  // Generar HTML para la vista previa de la factura
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vista Previa de Factura</title>
      <style>
        body {
          font-family: ${settings.fontFamily || "Arial"}, sans-serif;
          font-size: ${settings.fontSize || 12}pt;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background-color: #fff;
          padding: 30px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .company-info {
          flex: 1;
        }
        .logo {
          max-width: 200px;
          max-height: 80px;
        }
        .invoice-title {
          text-align: right;
          color: ${settings.primaryColor || "#3b82f6"};
        }
        .invoice-details {
          margin-bottom: 20px;
          border: 1px solid #ddd;
          padding: 10px;
          background-color: #f5f5f5;
        }
        .client-info {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: ${settings.primaryColor || "#3b82f6"};
          color: white;
          padding: 10px;
          text-align: left;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals table {
          width: 100%;
        }
        .totals td {
          padding: 5px;
        }
        .grand-total {
          font-weight: bold;
          font-size: 1.2em;
          color: ${settings.primaryColor || "#3b82f6"};
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.9em;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .signature {
          margin-top: 40px;
          text-align: right;
        }
        .signature img {
          max-width: 150px;
          max-height: 60px;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          opacity: 0.1;
          color: ${settings.secondaryColor || "#6b7280"};
          pointer-events: none;
          z-index: 1;
        }
        .payment-info {
          margin-top: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
        }
        .terms {
          margin-top: 20px;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${settings.showWatermark ? `<div class="watermark">${settings.watermarkText || "PAGADO"}</div>` : ""}
        
        <div class="header">
          <div class="company-info">
            ${settings.showLogo && settings.companyLogo ? `<img src="${settings.companyLogo}" alt="Logo" class="logo">` : ""}
            <h2>${settings.companyName || "Mi Empresa"}</h2>
            <p>RNC: ${settings.companyRNC || "000000000"}</p>
            <p>${settings.companyAddress || "Dirección de la empresa"}</p>
            <p>Tel: ${settings.companyPhone || "(000) 000-0000"}</p>
            <p>Email: ${settings.companyEmail || "info@empresa.com"}</p>
          </div>
          <div class="invoice-title">
            <h1>FACTURA</h1>
            <p>No. F-00001</p>
            <p>Fecha: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="invoice-details">
          <p><strong>NCF:</strong> B0100000001</p>
          <p><strong>Válida hasta:</strong> ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}</p>
        </div>
        
        <div class="client-info">
          <h3>Cliente:</h3>
          <p><strong>Nombre:</strong> Cliente Ejemplo</p>
          <p><strong>RNC/Cédula:</strong> 000-0000000-0</p>
          <p><strong>Dirección:</strong> Calle Cliente #123, Ciudad</p>
          <p><strong>Teléfono:</strong> (000) 000-0000</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Cantidad</th>
              <th>Descripción</th>
              <th>Precio Unitario</th>
              <th>ITBIS</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Producto o servicio de ejemplo 1</td>
              <td>RD$ 1,000.00</td>
              <td>RD$ 180.00</td>
              <td>RD$ 1,180.00</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Producto o servicio de ejemplo 2</td>
              <td>RD$ 500.00</td>
              <td>RD$ 90.00</td>
              <td>RD$ 1,180.00</td>
            </tr>
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td>RD$ 2,000.00</td>
            </tr>
            <tr>
              <td>ITBIS (18%):</td>
              <td>RD$ 360.00</td>
            </tr>
            <tr class="grand-total">
              <td>Total:</td>
              <td>RD$ 2,360.00</td>
            </tr>
          </table>
        </div>
        
        ${
          settings.showPaymentInfo
            ? `
        <div class="payment-info">
          <h3>Información de Pago:</h3>
          <p><strong>Banco:</strong> ${settings.bankName || "Banco Ejemplo"}</p>
          <p><strong>Cuenta:</strong> ${settings.bankAccount || "000-000000-0"}</p>
          <p><strong>Instrucciones:</strong> ${settings.paymentInstructions || "Favor realizar el pago dentro de los próximos 30 días."}</p>
        </div>
        `
            : ""
        }
        
        <div class="terms">
          <p><strong>Términos y Condiciones:</strong></p>
          <p>${settings.termsAndConditions || "Todos los precios incluyen ITBIS. Pago a 30 días."}</p>
        </div>
        
        ${
          settings.showSignature
            ? `
        <div class="signature">
          ${settings.signatureImage ? `<img src="${settings.signatureImage}" alt="Firma">` : ""}
          <p>${settings.signatureName || "Nombre"}</p>
          <p>${settings.signatureTitle || "Cargo"}</p>
        </div>
        `
            : ""
        }
        
        ${
          settings.showFooter
            ? `
        <div class="footer">
          <p>${settings.footerText || "Gracias por su preferencia"}</p>
        </div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `
}
