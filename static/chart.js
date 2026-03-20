document.addEventListener("DOMContentLoaded", function () {
    console.log("🔍 Checking Chart Data...");

    const categoriesElement = document.getElementById("categories-data");
    const amountsElement = document.getElementById("amounts-data");

    if (!categoriesElement || !amountsElement) {
        console.error("❌ Missing data elements.");
        return;
    }

    const categories = JSON.parse(categoriesElement.textContent);
    const amounts = JSON.parse(amountsElement.textContent);

    console.log("📊 Categories:", categories);
    console.log("💰 Amounts:", amounts);

    if (categories.length === 0 || amounts.length === 0) {
        console.warn("⚠️ No data available for charts.");
        return;
    }

    loadChart(document.getElementById("barChart").getContext("2d"), "bar");
});
