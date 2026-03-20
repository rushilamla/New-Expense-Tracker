document.addEventListener("DOMContentLoaded", function () {
    window.generatePDF = function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Expense Report", 20, 20);
        doc.text(`Total Spent: ₹ ${document.querySelector("strong").innerText}`, 20, 30); // Ensure ₹ is properly displayed

        let rows = [];
        document.querySelectorAll("table tbody tr").forEach(row => {
            let cols = row.querySelectorAll("td");
            let category = cols[0].innerText;
            let amount = cols[1].innerText.replace("₹", ""); // Remove ₹ symbol to avoid encoding issues
            let date = cols[2].innerText;
            rows.push([category, `₹ ${amount}`, date]); // Add ₹ manually to avoid superscript issue
        });

        doc.autoTable({
            head: [["Category", "Amount", "Date"]],
            body: rows,
            startY: 40
        });

        doc.save("expense_report.pdf");
    };
});
