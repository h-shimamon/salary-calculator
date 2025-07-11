// script.js

// アプリが読み込まれたら実行
document.addEventListener('DOMContentLoaded', async () => {
    // --- STEP1: データの読み込み ---
    let insuranceData = {};
    let taxTableData = {}; // tax-table.jsonのデータを格納する変数を追加
    try {
        // data.jsonとtax-table.jsonを同時に読み込む
        const [insuranceResponse, taxResponse] = await Promise.all([
            fetch('data.json'),
            fetch('tax-table.json')
        ]);
        insuranceData = await insuranceResponse.json();
        taxTableData = await taxResponse.json();
    } catch (error) {
        console.error('設定データの読み込みに失敗しました:', error);
        alert('設定データの読み込みに失敗しました。');
        return;
    }

    // --- STEP2: 都道府県プルダウンの作成 ---
    const workLocationSelect = document.getElementById('work-location');
    const prefectures = Object.keys(insuranceData.prefectures);
    prefectures.forEach(pref => {
        const option = document.createElement('option');
        option.value = pref;
        option.textContent = pref;
        workLocationSelect.appendChild(option);
    });
    workLocationSelect.value = '東京都'; // 初期値を設定

    // --- STEP3: 計算実行と画面遷移 ---
    const calculateButton = document.getElementById('calculate-button');
    calculateButton.addEventListener('click', () => {
        // メインの計算処理を実行
        calculateAndDisplay();

        // 画面遷移
        const inputScreen = document.getElementById('input-screen');
        const resultsScreen = document.getElementById('results-screen');
        const appContainer = document.querySelector('.app-container');
        inputScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        appContainer.style.height = `${resultsScreen.offsetHeight}px`;
    });

    // --- メインの計算処理 ---
    function calculateAndDisplay() {
        // --- 1. 入力値の取得 ---
        const ageGroup = document.getElementById('age-group').value;
        const location = document.getElementById('work-location').value;
        const dependents = parseInt(document.getElementById('dependents').value) || 0;
        const basicSalary = parseInt(document.getElementById('basic-salary').value) || 0;
        const overtimePay = parseInt(document.getElementById('overtime-pay').value) || 0;
        const transportationCost = parseInt(document.getElementById('transportation-cost').value) || 0;
        const residentTax = parseInt(document.getElementById('resident-tax').value) || 0;

        // --- 2. 社会保険料の計算 ---
        // 標準報酬月額の基準となる給与額を計算 (交通費も含む)
        const remuneration = basicSalary + overtimePay + transportationCost;

        // 標準報酬月額の等級を決定
        const remunerationTier = getStandardRemuneration(remuneration);
        const standardRemuneration = remunerationTier.standardValue;

        // 健康保険料の計算
        const healthInsuranceRate = insuranceData.prefectures[location].healthInsuranceRate / 100;
        const healthInsurancePremium = Math.floor(standardRemuneration * healthInsuranceRate / 2);

        // 介護保険料の計算 (40歳～64歳が対象)
        let careInsurancePremium = 0;
        if (ageGroup === '40to64') {
            const careInsuranceRate = insuranceData.prefectures[location].careInsuranceRate / 100;
            careInsurancePremium = Math.floor(standardRemuneration * careInsuranceRate / 2);
        }

        // 厚生年金保険料の計算
        const pensionRate = insuranceData.pensionRate / 100;
        const pensionInsurancePremium = Math.floor(standardRemuneration * pensionRate / 2);

        // 雇用保険料の計算 (交通費も含む課税対象額で計算)
        const employmentInsuranceTarget = basicSalary + overtimePay + transportationCost;
        const employmentInsuranceRate = insuranceData.employmentInsuranceRate / 100;
        const employmentInsurancePremium = Math.floor(employmentInsuranceTarget * employmentInsuranceRate);
        
        // --- 3. 税金の計算 ---
        const socialInsuranceTotal = healthInsurancePremium + careInsurancePremium + pensionInsurancePremium;
        // 課税対象額 = (基本給 + 残業代) - 社会保険料合計
        const taxableSalary = (basicSalary + overtimePay) - socialInsuranceTotal;
        // 所得税を税額表から取得
        const incomeTax = getIncomeTax(taxableSalary, dependents);

        // --- 4. 合計値の計算 ---
        // 総支給額 (交通費も含む)
        const grossSalary = basicSalary + overtimePay + transportationCost;
        // 控除額合計
        const totalDeductions = socialInsuranceTotal + employmentInsurancePremium + incomeTax + residentTax;
        // 差引支給額 (手取り)
        const netSalary = grossSalary - totalDeductions;

        // --- 5. 結果の表示 ---
        // 金額をフォーマットして表示
        document.getElementById('gross-salary').textContent = formatCurrency(grossSalary);
        document.getElementById('total-deductions').textContent = formatCurrency(totalDeductions);
        document.getElementById('net-salary-total').textContent = formatCurrency(netSalary);

        document.getElementById('health-insurance').textContent = formatCurrency(healthInsurancePremium);
        document.getElementById('health-insurance-sub').textContent = `等級: ${remunerationTier.grade} / 標準報酬: ${formatCurrency(standardRemuneration, '')}`;
        document.getElementById('care-insurance').textContent = formatCurrency(careInsurancePremium);
        document.getElementById('pension-insurance').textContent = formatCurrency(pensionInsurancePremium);
        document.getElementById('pension-insurance-sub').textContent = `等級: ${remunerationTier.grade} / 標準報酬: ${formatCurrency(standardRemuneration, '')}`;
        document.getElementById('employment-insurance').textContent = formatCurrency(employmentInsurancePremium);
        
        document.getElementById('income-tax').textContent = formatCurrency(incomeTax);
        document.getElementById('resident-tax-result').textContent = formatCurrency(residentTax);
    }

    // --- ヘルパー関数 (補助的な機能) ---

    // 給与額から標準報酬月額の等級を取得する関数
    function getStandardRemuneration(salary) {
        const tier = insuranceData.standardRemunerationTiers.find(t => 
            salary >= t.minSalary && salary < t.maxSalary
        );
        // もし該当する等級がなければ、最後の等級を返す
        return tier || insuranceData.standardRemunerationTiers[insuranceData.standardRemunerationTiers.length - 1];
    }

    // 課税対象額と扶養人数から所得税を取得する関数
    function getIncomeTax(taxableSalary, dependents) {
        if (taxableSalary < 0) return 0; // 課税対象額がマイナスなら0
        const tier = taxTableData.monthly.find(t => 
            taxableSalary >= t.min && taxableSalary < t.max
        );
        if (!tier) {
             // 範囲外（高額所得者）の場合は、最後の等級の税額を返す（簡易的な対応）
            const lastTier = taxTableData.monthly[taxTableData.monthly.length - 1];
            const dependentIndex = Math.min(dependents, 7);
            return lastTier.tax[dependentIndex] || 0;
        }

        // 扶養親族が7人を超える場合は、7人用の税額（配列の最後の値）を使用する
        const dependentIndex = Math.min(dependents, 7);
        return tier.tax[dependentIndex] || 0;
    }

    // 数値を「¥ 123,456」の形式に変換する関数
    function formatCurrency(amount, symbol = '¥ ') {
        return symbol + amount.toLocaleString();
    }


    // --- 戻るボタンの処理 (変更なし) ---
    const backButton = document.getElementById('back-button');
    const inputScreen = document.getElementById('input-screen');
    const resultsScreen = document.getElementById('results-screen');
    const appContainer = document.querySelector('.app-container');
    backButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        inputScreen.classList.remove('hidden');
        appContainer.style.height = `${inputScreen.offsetHeight}px`;
    });
    appContainer.style.height = `${inputScreen.offsetHeight}px`;
});
