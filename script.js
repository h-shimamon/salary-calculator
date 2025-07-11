// script.js

// アプリが読み込まれたら実行
document.addEventListener('DOMContentLoaded', async () => {
    // --- STEP1: データの読み込み ---
    let insuranceData = {};
    try {
        const response = await fetch('data.json');
        insuranceData = await response.json();
    } catch (error) {
        console.error('保険料データの読み込みに失敗しました:', error);
        alert('設定データの読み込みに失敗しました。');
        return;
    }

    // --- STEP2: 画面要素の取得 ---
    const workLocationSelect = document.getElementById('work-location');
    
    // --- STEP3: 都道府県プルダウンの作成 ---
    // data.jsonから都道府県のリストを取得してプルダウンを作る
    const prefectures = Object.keys(insuranceData.prefectures);
    prefectures.forEach(pref => {
        const option = document.createElement('option');
        option.value = pref;
        option.textContent = pref;
        workLocationSelect.appendChild(option);
    });
    workLocationSelect.value = '東京都'; // 初期値を設定

    // --- STEP4: 計算ボタンのイベント設定 ---
    const calculateButton = document.getElementById('calculate-button');
    calculateButton.addEventListener('click', () => {
        // ここに計算処理を書いていく
        // (次のステップで詳しく解説します)
        console.log("計算ボタンが押されました！");

        // 入力値の取得 (例)
        const ageGroup = document.getElementById('age-group').value;
        const location = document.getElementById('work-location').value;
        const basicSalary = parseInt(document.getElementById('basic-salary').value) || 0;
        
        console.log('年齢:', ageGroup, '場所:', location, '基本給:', basicSalary);


        // --- 画面遷移処理 ---
        const inputScreen = document.getElementById('input-screen');
        const resultsScreen = document.getElementById('results-screen');
        const appContainer = document.querySelector('.app-container');
        
        inputScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        appContainer.style.height = `${resultsScreen.offsetHeight}px`;
    });

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