import React, { useEffect } from "react";

const Invoice = ({ orderInfo, setShowInvoice, autoPrint = false, onPrinted }) => {
  if (!orderInfo) return null;

  const { receipt } = orderInfo;

  const handlePrint = () => {
    const printWindow = window.open("", "PRINT", "height=600,width=400");
    if (!printWindow) return;
    printWindow.document.write("<html><head><title>Receipt</title>");
    printWindow.document.write("<style>body{font-family: monospace;white-space:pre-wrap;padding:16px} h2{text-align:center}</style>");
    printWindow.document.write("</head><body>");
    printWindow.document.write(`<h2>${receipt?.cafeName || "Café"}</h2>`);
    printWindow.document.write(`<pre>${receipt?.content || ""}</pre>`);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    if (typeof onPrinted === "function") {
      try {
        onPrinted();
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Receipt</h3>
        <div className="text-sm font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded mb-4">
          {receipt?.content}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#025cca] text-white py-2 rounded"
          >
            Print
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="flex-1 bg-gray-300 text-black py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
