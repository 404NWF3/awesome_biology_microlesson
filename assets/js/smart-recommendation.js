// 仅保留本次答题数据的分析结果
let currentSessionData = {
    wrongQuestions: [],      // 本次答错的题ID
    weakKnowledgePoints: [], // 本次薄弱知识点
    accuracyRate: 0          // 本次正确率
};

// 题库数据
let questionBank = [];

// 加载智能题库数据
async function loadQuestionBank() {
    try {
        console.log('开始从外部JSON文件加载智能题库...');
        const response = await fetch('assets/questions/smart-questions.json');
        console.log('智能题库请求状态:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP 错误! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response text preview:', text.substring(0, 100));
        try {
            const data = JSON.parse(text);
            console.log('智能题库原始数据:', data);
            
            if (!data.smartTest || !data.smartTest.questions) {
                console.error('智能题库数据格式不正确，找不到smartTest.questions');
                throw new Error('智能题库数据格式不正确');
            }
            
            // 从smartTest中获取题目
            questionBank = data.smartTest.questions || [];
            
            console.log(`智能题库加载完成，共 ${questionBank.length} 道题目`);
            console.log('智能题库内容示例:', questionBank.slice(0, 2));
            return true;
        } catch (error) {
            console.error('JSON解析失败:', error);
            document.getElementById('recommendation-content').innerHTML = `
                <div class="error-message">
                    <p>加载智能题库数据失败: ${error.message}</p>
                    <p>可能原因: 文件编码错误，请确保smart-questions.json使用UTF-8编码且不含BOM标记</p>
                    <button onclick="location.reload()">重试</button>
                </div>
            `;
            return false;
        }
    } catch (error) {
        console.error('加载智能题库失败:', error);
        document.getElementById('recommendation-content').innerHTML = `
            <div class="error-message">
                <p>加载智能题库数据失败: ${error.message}</p>
                <p>可能原因: 文件编码错误，请确保smart-questions.json使用UTF-8编码且不含BOM标记</p>
                <button onclick="location.reload()">重试</button>
            </div>
        `;
        return false;
    }
}

// 核心保留函数（只需要这3个）
// 1. 分析本次答题数据
function analyzeCurrentSession() {
    // 从quiz.js获取本次答题数据
    const quizData = JSON.parse(localStorage.getItem('currentQuizData')) || {};
    console.log('获取到的答题数据:', quizData);
    
    // 重置数据
    currentSessionData = {
        wrongQuestions: [],
        weakKnowledgePoints: [],
        accuracyRate: 0
    };

    // 计算错题和薄弱点
    const knowledgeMap = {};
    let correctCount = 0;
    
    console.log('开始分析答题数据:', quizData.questions?.length || 0, '道题');
    quizData.questions?.forEach((item, index) => {
        console.log(`分析第${index+1}题:`, item);
        if (item.score < 60) {
            currentSessionData.wrongQuestions.push(item.id);
            console.log(`题目${item.id}为错题，分数:${item.score}`);
            
            // 记录知识点错误次数
            if (item.knowledgePoints) {
                if (Array.isArray(item.knowledgePoints)) {
                    // 如果是数组，就遍历
                    item.knowledgePoints.forEach(kp => {
                        knowledgeMap[kp] = (knowledgeMap[kp] || 0) + 1;
                        console.log(`知识点'${kp}'错误次数+1，当前:${knowledgeMap[kp]}`);
                    });
                } else if (typeof item.knowledgePoints === 'string') {
                    // 如果是字符串，就直接处理
                    const kp = item.knowledgePoints;
                    knowledgeMap[kp] = (knowledgeMap[kp] || 0) + 1;
                    console.log(`知识点'${kp}'错误次数+1，当前:${knowledgeMap[kp]}`);
                }
            } else if (item.knowledgePoint) {
                // 处理单个知识点（knowledgePoint而非knowledgePoints）
                // 兼容字符串和数组
                if (Array.isArray(item.knowledgePoint)) {
                    item.knowledgePoint.forEach(kp => {
                        knowledgeMap[kp] = (knowledgeMap[kp] || 0) + 1;
                        console.log(`知识点'${kp}'错误次数+1，当前:${knowledgeMap[kp]}`);
                    });
                } else if (typeof item.knowledgePoint === 'string') {
                    const kp = item.knowledgePoint;
                    knowledgeMap[kp] = (knowledgeMap[kp] || 0) + 1;
                    console.log(`知识点'${kp}'错误次数+1，当前:${knowledgeMap[kp]}`);
                }
            }
        } else {
            correctCount++;
            console.log(`题目${item.id}为正确题，分数:${item.score}`);
        }
    });

    // 计算正确率
    currentSessionData.accuracyRate = quizData.questions?.length 
        ? Math.round((correctCount / quizData.questions.length) * 100)
        : 0;
    console.log('计算正确率:', correctCount, '/', quizData.questions?.length, '=', currentSessionData.accuracyRate, '%');

    // 找出错误率>50%的知识点
    console.log('知识点错误统计:', knowledgeMap);
    currentSessionData.weakKnowledgePoints = Object.entries(knowledgeMap)
        .filter(([_, count]) => count > 1) // 至少错2题
        .map(([kp]) => kp);
    console.log('筛选出的薄弱知识点:', currentSessionData.weakKnowledgePoints);
        
    // 也可以从URL参数获取正确率（如果有）
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('score')) {
        const scoreFromUrl = parseFloat(urlParams.get('score'));
        console.log('从URL获取到分数:', scoreFromUrl);
        if (!isNaN(scoreFromUrl)) {
            currentSessionData.accuracyRate = scoreFromUrl;
            console.log('使用URL分数覆盖:', currentSessionData.accuracyRate);
        }
    }
    
    console.log('分析结果:', currentSessionData);
}

// 2. 生成推荐题目
function generateRecommendations() {
    // 只有题库加载完成才能推荐
    if (!questionBank.length) {
        console.warn('题库未加载，无法生成推荐');
        document.getElementById('no-recommendations').style.display = 'block';
        return;
    }
    
    console.log('开始生成推荐题目...');
    console.log('错题ID列表:', currentSessionData.wrongQuestions);
    // 优先推荐错题
    const wrongQuestions = questionBank.filter(q => 
        currentSessionData.wrongQuestions.includes(q.id)
    );
    console.log('找到错题数量:', wrongQuestions.length, wrongQuestions);
    
    // 其次推荐薄弱知识点题目
    console.log('薄弱知识点:', currentSessionData.weakKnowledgePoints);
    const weakKnowledgeQuestions = questionBank.filter(q => {
        // 不包含在错题中
        if (currentSessionData.wrongQuestions.includes(q.id)) {
            console.log(`题目${q.id}已在错题中，跳过`);
            return false;
        }
        
        // 知识点匹配 - 处理knowledgePoint为数组的情况
        if (q.knowledgePoint) {
            if (Array.isArray(q.knowledgePoint)) {
                // 如果是数组，检查是否有交集
                const matchedPoints = q.knowledgePoint.filter(kp => 
                    currentSessionData.weakKnowledgePoints.includes(kp)
                );
                if (matchedPoints.length > 0) {
                    console.log(`题目${q.id}的知识点${matchedPoints}匹配薄弱点`);
                    return true;
                }
            } else if (typeof q.knowledgePoint === 'string') {
                // 如果是字符串，直接检查
                const isMatch = currentSessionData.weakKnowledgePoints.includes(q.knowledgePoint);
                if (isMatch) console.log(`题目${q.id}的知识点${q.knowledgePoint}匹配薄弱点`);
                return isMatch;
            }
        } else if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
            const matchedPoints = q.knowledgePoints.filter(kp => 
                currentSessionData.weakKnowledgePoints.includes(kp)
            );
            if (matchedPoints.length > 0) console.log(`题目${q.id}的知识点${matchedPoints}匹配薄弱点`);
            return matchedPoints.length > 0;
        }
        return false;
    });
    console.log('找到薄弱知识点题目数量:', weakKnowledgeQuestions.length, weakKnowledgeQuestions);
    
    // 如果推荐数量不足，随机添加一些题目
    let additionalQuestions = [];
    if (wrongQuestions.length + weakKnowledgeQuestions.length < 5) {
        console.log('推荐题目不足5题，添加随机题目...');
        
        // 获取已选题目ID集合
        const selectedIds = new Set([
            ...wrongQuestions.map(q => q.id),
            ...weakKnowledgeQuestions.map(q => q.id)
        ]);
        
        // 随机选择一些未包含的题目
        additionalQuestions = questionBank
            .filter(q => !selectedIds.has(q.id))
            .sort(() => Math.random() - 0.5)  // 随机排序
            .slice(0, 5 - (wrongQuestions.length + weakKnowledgeQuestions.length));
            
        console.log('添加随机题目数量:', additionalQuestions.length);
    }
    
    // 合并并去重
    const allRecommendations = [
        ...wrongQuestions,
        ...weakKnowledgeQuestions,
        ...additionalQuestions
    ];
    console.log('合并后推荐总题数:', allRecommendations.length);
    
    if (allRecommendations.length > 0) {
        renderRecommendations(allRecommendations);
    } else {
        console.log('没有推荐题目');
        document.getElementById('no-recommendations').style.display = 'block';
    }
}

// 3. 渲染推荐题目
function renderRecommendations(questions) {
    console.log('开始渲染推荐题目，数量:', questions.length);
    const container = document.getElementById('recommendation-list');
    if (!container) {
        console.error('找不到recommendation-list元素');
        return;
    }
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        console.log(`渲染第${index+1}个推荐题:`, q);
        const item = document.createElement('div');
        item.className = 'question-card';
        item.dataset.questionId = q.id;
        item.dataset.questionType = q.type || '';
        item.dataset.difficulty = q.difficulty || '';
        
        // 知识点处理
        let knowledgePointsText = '';
        let knowledgePoints = [];
        if (q.knowledgePoint) {
            knowledgePoints = Array.isArray(q.knowledgePoint) ? q.knowledgePoint : [q.knowledgePoint];
        } else if (q.knowledgePoints) {
            knowledgePoints = Array.isArray(q.knowledgePoints) ? q.knowledgePoints : [q.knowledgePoints];
        }
        knowledgePointsText = knowledgePoints.join(', ');
        
        // 题目难度
        let difficultyText = getDifficultyLabel(q.difficulty);
        
        // 题目类型
        let typeText = getTypeLabel(q.type);
        
        // 构建题目头部
        let headerHTML = `
            <div class="question-header">
                ${typeText ? `<span class="question-type">${typeText}</span>` : ''}
                ${difficultyText ? `<span class="question-difficulty">${difficultyText}</span>` : ''}
                ${knowledgePointsText ? `<span class="question-knowledge">知识点: ${knowledgePointsText}</span>` : ''}
                <span class="question-points">分值: ${q.points || 10} 分</span>
            </div>
        `;
        
        // 构建题目内容
        let questionHTML = `
            <div class="question-content">
                <p class="question-text">${q.question}</p>
            </div>
        `;
        
        // 根据题目类型构建答题区域
        let answerHTML = '';
        
        if (q.type === 'choice') {
            // 选择题
            answerHTML = `<div class="answer-options">`;
            if (q.options && Array.isArray(q.options)) {
                q.options.forEach((option, i) => {
                    const optionLetter = String.fromCharCode(65 + i); // A, B, C, D...
                    // 处理选项可能是对象的情况
                    const optionText = typeof option === 'object' ? 
                                      (option.text || option.content || JSON.stringify(option)) : 
                                      option;
                    
                    answerHTML += `
                        <div class="option">
                            <input type="radio" id="q${q.id}_option${i}" name="question_${q.id}" value="${optionLetter}" class="radio-input">
                            <label for="q${q.id}_option${i}" class="radio-label">
                                <span class="option-marker">${optionLetter}</span>
                                <span class="option-text">${optionText}</span>
                            </label>
                        </div>
                    `;
                });
            }
            answerHTML += `</div>`;
        } else if (q.type === 'fill') {
            // 填空题
            let questionText = q.question;
            let blankCount = (questionText.match(/____/g) || []).length;
            
            answerHTML = `<div class="fill-blanks">`;
            for (let i = 0; i < (blankCount || 1); i++) {
                answerHTML += `
                    <div class="blank-item">
                        <span class="blank-number">${i + 1}.</span>
                        <input type="text" class="blank-input" id="blank_${q.id}_${i}" placeholder="填写答案">
                    </div>
                `;
            }
            answerHTML += `</div>`;
        } else if (q.type === 'essay') {
            // 简答题
            answerHTML = `
                <div class="essay-answer">
                    <textarea id="essay_${q.id}" class="essay-input" rows="5" placeholder="在此处输入您的答案..."></textarea>
                </div>
            `;
        } else if (q.type === 'completion') {
            // 综合题
            answerHTML = `
                <div class="completion-answer">
                    <div class="completion-question">${q.question}</div>
                    <div class="completion-subquestions">`;
            
            if (q.subQuestions && Array.isArray(q.subQuestions)) {
                q.subQuestions.forEach((subQ, sIdx) => {
                    answerHTML += `
                        <div class="subquestion" id="subq_${q.id}_${subQ.id || sIdx}">
                            <p class="subquestion-text">${subQ.question}</p>
                    `;
                    
                    if (subQ.type === 'choice') {
                        // 子题为选择题
                        answerHTML += `<div class="answer-options subquestion-options">`;
                        if (subQ.options && Array.isArray(subQ.options)) {
                            subQ.options.forEach((option, i) => {
                                const optionLetter = String.fromCharCode(65 + i);
                                // 处理选项可能是对象的情况
                                const optionText = typeof option === 'object' ? 
                                                  (option.text || option.content || JSON.stringify(option)) : 
                                                  option;
                                
                                answerHTML += `
                                    <div class="option">
                                        <input type="radio" id="sq${q.id}_${subQ.id || sIdx}_option${i}" 
                                               name="subq_${q.id}_${subQ.id || sIdx}" value="${optionLetter}" class="radio-input">
                                        <label for="sq${q.id}_${subQ.id || sIdx}_option${i}" class="radio-label">
                                            <span class="option-marker">${optionLetter}</span>
                                            <span class="option-text">${optionText}</span>
                                        </label>
                                    </div>
                                `;
                            });
                        }
                        answerHTML += `</div>`;
                    } else if (subQ.type === 'fill') {
                        // 子题为填空题
                        let blankCount = (subQ.question.match(/____/g) || []).length || 1;
                        answerHTML += `<div class="fill-blanks subquestion-blanks">`;
                        for (let i = 0; i < (blankCount || 1); i++) {
                            answerHTML += `
                                <div class="blank-item">
                                    <span class="blank-number">${i + 1}.</span>
                                    <input type="text" class="blank-input" 
                                           id="blank_${q.id}_${subQ.id || sIdx}_${i}" placeholder="填写答案">
                                </div>
                            `;
                        }
                        answerHTML += `</div>`;
                    } else {
                        // 子题为简答题
                        answerHTML += `
                            <div class="essay-answer subquestion-essay">
                                <textarea id="essay_${q.id}_${subQ.id || sIdx}" class="essay-input" 
                                          rows="3" placeholder="在此处输入您的答案..."></textarea>
                            </div>
                        `;
                    }
                    
                    answerHTML += `</div>`;
                });
            }
            
            answerHTML += `</div></div>`;
        }
        
        // 添加提交和反馈区域
        answerHTML += `
            <div class="question-actions">
                <button class="check-answer-btn" onclick="checkRecommendedAnswer('${q.id}')">检查答案</button>
            </div>
            <div id="feedback_${q.id}" class="answer-feedback"></div>
        `;
        
        item.innerHTML = headerHTML + questionHTML + answerHTML;
        container.appendChild(item);
    });
    
    // 显示统计信息
    updateStatistics();
}

// 获取难度标签
function getDifficultyLabel(difficulty) {
    switch(difficulty) {
        case 'easy': return '简单';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return difficulty || '';
    }
}

// 获取题型标签
function getTypeLabel(type) {
    switch(type) {
        case 'choice': return '选择题';
        case 'fill': return '填空题';
        case 'essay': return '简答题';
        case 'completion': return '综合题';
        default: return type || '';
    }
}

// 检查推荐题答案
function checkRecommendedAnswer(questionId) {
    console.log('检查推荐题答案:', questionId);
    const question = questionBank.find(q => q.id === questionId);
    if (!question) {
        console.error('找不到题目:', questionId);
        return;
    }
    
    let result = {
        correct: false,
        userAnswer: '',
        score: 0,
        feedback: ''
    };
    
    // 根据题目类型获取答案
    if (question.type === 'choice') {
        const selectedOption = document.querySelector(`input[name="question_${questionId}"]:checked`);
        if (selectedOption) {
            result.userAnswer = selectedOption.value;
            if (result.userAnswer === question.answer) {
                result.correct = true;
                result.score = question.points || 10;
                result.feedback = '回答正确！';
            } else {
                result.feedback = `回答错误。正确答案是: ${question.answer}`;
            }
        } else {
            result.feedback = '请选择一个选项';
        }
    } else if (question.type === 'fill') {
        // 处理填空题
        let blankCount = (question.question.match(/____/g) || []).length || 1;
        let allCorrect = true;
        let blanksAnswers = [];
        
        for (let i = 0; i < blankCount; i++) {
            const answerField = document.getElementById(`blank_${questionId}_${i}`);
            if (answerField && answerField.value.trim()) {
                blanksAnswers.push(answerField.value.trim());
            } else {
                blanksAnswers.push('');
            }
        }
        
        result.userAnswer = blanksAnswers.join('|');
        
        // 检查答案 - 简单实现，实际应匹配question.answer的格式
        let correctAnswers = Array.isArray(question.answer) ? 
                            question.answer : 
                            question.answer.split('|');
                            
        correctAnswers = correctAnswers.map(ans => ans.trim());
        
        for (let i = 0; i < Math.min(blanksAnswers.length, correctAnswers.length); i++) {
            if (blanksAnswers[i] !== correctAnswers[i]) {
                allCorrect = false;
                break;
            }
        }
        
        if (allCorrect && blanksAnswers.length === correctAnswers.length) {
            result.correct = true;
            result.score = question.points || 10;
            result.feedback = '填空正确！';
        } else {
            result.feedback = `填空错误。正确答案是: ${correctAnswers.join('、')}`;
        }
    } else if (question.type === 'essay') {
        // 简答题 - 仅记录答案，显示参考答案
        const answerField = document.getElementById(`essay_${questionId}`);
        if (answerField && answerField.value.trim()) {
            result.userAnswer = answerField.value.trim();
            result.feedback = '已记录您的答案。参考答案：';
            result.correct = null; // 需要人工评分
        } else {
            result.feedback = '请输入您的答案';
        }
    } else if (question.type === 'completion') {
        // 综合题 - 处理子题
        if (question.subQuestions && Array.isArray(question.subQuestions)) {
            let subAnswers = [];
            let subScores = [];
            
            question.subQuestions.forEach((subQ, sIdx) => {
                const subId = subQ.id || sIdx;
                
                if (subQ.type === 'choice') {
                    const selected = document.querySelector(`input[name="subq_${questionId}_${subId}"]:checked`);
                    if (selected) {
                        subAnswers.push(`${subId}:${selected.value}`);
                        if (selected.value === subQ.answer) {
                            subScores.push(subQ.points || (question.points / question.subQuestions.length));
                        } else {
                            subScores.push(0);
                        }
                    } else {
                        subAnswers.push(`${subId}:未作答`);
                        subScores.push(0);
                    }
                } else if (subQ.type === 'fill') {
                    let blankCount = (subQ.question.match(/____/g) || []).length || 1;
                    let blankAnswers = [];
                    
                    for (let i = 0; i < blankCount; i++) {
                        const field = document.getElementById(`blank_${questionId}_${subId}_${i}`);
                        if (field && field.value.trim()) {
                            blankAnswers.push(field.value.trim());
                        } else {
                            blankAnswers.push('');
                        }
                    }
                    
                    subAnswers.push(`${subId}:${blankAnswers.join('|')}`);
                    
                    // 检查答案 - 简化实现
                    let correctSubAnswers = Array.isArray(subQ.answer) ? 
                                        subQ.answer : 
                                        subQ.answer.split('|');
                    let allBlankCorrect = true;
                    
                    for (let i = 0; i < Math.min(blankAnswers.length, correctSubAnswers.length); i++) {
                        if (blankAnswers[i] !== correctSubAnswers[i]) {
                            allBlankCorrect = false;
                            break;
                        }
                    }
                    
                    if (allBlankCorrect && blankAnswers.length === correctSubAnswers.length) {
                        subScores.push(subQ.points || (question.points / question.subQuestions.length));
                    } else {
                        subScores.push(0);
                    }
                } else {
                    // 简答题子题
                    const field = document.getElementById(`essay_${questionId}_${subId}`);
                    if (field && field.value.trim()) {
                        subAnswers.push(`${subId}:${field.value.trim()}`);
                        subScores.push(null); // 需要人工评分
                    } else {
                        subAnswers.push(`${subId}:未作答`);
                        subScores.push(0);
                    }
                }
            });
            
            result.userAnswer = subAnswers.join(';');
            
            // 计算得分 - 仅包含自动评分的子题
            const autoScoreTotal = subScores.filter(s => s !== null).reduce((sum, score) => sum + score, 0);
            const totalPossibleScore = subScores.filter(s => s !== null).length * (question.points / question.subQuestions.length);
            
            if (totalPossibleScore > 0) {
                result.score = Math.round((autoScoreTotal / totalPossibleScore) * question.points);
            }
            
            result.feedback = '综合题已记录答案';
            if (subScores.some(s => s === null)) {
                result.correct = null; // 部分需要人工评分
            } else {
                result.correct = result.score >= question.points * 0.6;
            }
        }
    }
    
    // 显示答题结果
    displayRecommendedResult(questionId, result, question);
    
    // 保存答题记录
    saveRecommendedAnswer(questionId, result);
}

// 显示推荐题答题结果
function displayRecommendedResult(questionId, result, question) {
    const feedbackEl = document.getElementById(`feedback_${questionId}`);
    if (!feedbackEl) return;
    
    let feedbackHTML = '';
    
    if (result.feedback) {
        const feedbackClass = result.correct === true ? 'feedback-correct' : 
                            result.correct === false ? 'feedback-incorrect' : 'feedback-pending';
        feedbackHTML += `<div class="${feedbackClass}">${result.feedback}</div>`;
    }
    
    // 处理不同题型的答案展示
    if (question.type === 'choice') {
        // 选择题答案展示
        if (question.answer && result.correct === false) {
            // 查找正确选项的文本
            const correctOptionIndex = question.answer.charCodeAt(0) - 65; // A=0, B=1, etc
            let correctOptionText = '';
            
            if (question.options && question.options[correctOptionIndex]) {
                const option = question.options[correctOptionIndex];
                correctOptionText = typeof option === 'object' ? 
                                  (option.text || option.content || JSON.stringify(option)) : 
                                  option;
            }
            
            feedbackHTML += `<div class="feedback-answer">
                <strong>正确答案:</strong> ${question.answer}. ${correctOptionText}
            </div>`;
        }
    } else if (question.type === 'fill') {
        // 填空题答案展示 - 有序显示每个空的答案
        if (result.correct === false) {
            let correctAnswers = Array.isArray(question.answer) ? 
                                question.answer : 
                                question.answer.split('|');
            
            feedbackHTML += `<div class="feedback-answer"><strong>正确答案:</strong>`;
            feedbackHTML += `<ol class="blank-answers-list">`;
            
            correctAnswers.forEach((ans, index) => {
                feedbackHTML += `<li>空${index + 1}: ${ans}</li>`;
            });
            
            feedbackHTML += `</ol></div>`;
        }
    } else if (question.type === 'essay') {
        // 简答题参考答案
        if (question.answer) {
            feedbackHTML += `<div class="reference-answer">
                <h4>参考答案:</h4>
                <div class="answer-content">${question.answer}</div>
            </div>`;
        }
    } else if (question.type === 'completion') {
        // 综合题 - 有序显示每个子题的答案
        if (question.subQuestions && Array.isArray(question.subQuestions)) {
            feedbackHTML += `<div class="reference-answer">
                <h4>参考答案:</h4>
                <ol class="subquestion-answers-list">`;
            
            question.subQuestions.forEach((subQ, index) => {
                feedbackHTML += `<li><strong>子题 ${index + 1}:</strong> `;
                
                if (subQ.type === 'choice') {
                    // 选择题子题
                    const correctOptionIndex = subQ.answer.charCodeAt(0) - 65;
                    let correctOptionText = '';
                    
                    if (subQ.options && subQ.options[correctOptionIndex]) {
                        const option = subQ.options[correctOptionIndex];
                        correctOptionText = typeof option === 'object' ? 
                                          (option.text || option.content || JSON.stringify(option)) : 
                                          option;
                    }
                    
                    feedbackHTML += `${subQ.answer}. ${correctOptionText}`;
                } else if (subQ.type === 'fill') {
                    // 填空题子题
                    let subAnswers = Array.isArray(subQ.answer) ? 
                                    subQ.answer : 
                                    subQ.answer.split('|');
                    
                    if (subAnswers.length > 1) {
                        feedbackHTML += `<ol class="sub-blank-list">`;
                        subAnswers.forEach((ans, blankIndex) => {
                            feedbackHTML += `<li>空${blankIndex + 1}: ${ans}</li>`;
                        });
                        feedbackHTML += `</ol>`;
                    } else {
                        feedbackHTML += subQ.answer;
                    }
                } else {
                    // 简答题子题
                    feedbackHTML += subQ.answer;
                }
                
                feedbackHTML += `</li>`;
            });
            
            feedbackHTML += `</ol></div>`;
        }
    }
    
    // 添加解析
    if (question.explanation) {
        feedbackHTML += `<div class="feedback-explanation">
            <h4>答案解析:</h4>
            <div class="explanation-content">${question.explanation}</div>
        </div>`;
    }
    
    feedbackEl.innerHTML = feedbackHTML;
    feedbackEl.style.display = 'block'; // 确保反馈区域显示
}

// 保存推荐题答题记录
function saveRecommendedAnswer(questionId, result) {
    // 从本地存储获取历史记录
    const practiceHistory = JSON.parse(localStorage.getItem('practiceHistory') || '{}');
    
    // 添加新的答题记录
    practiceHistory[questionId] = {
        userAnswer: result.userAnswer,
        correct: result.correct,
        score: result.score,
        timestamp: new Date().toISOString()
    };
    
    // 保存到本地存储
    localStorage.setItem('practiceHistory', JSON.stringify(practiceHistory));
    console.log('已保存答题记录:', questionId, result);
}

// 更新统计信息
function updateStatistics() {
    console.log('更新页面统计信息');
    const accuracyElement = document.getElementById('accuracy-rate');
    if (accuracyElement) {
        accuracyElement.textContent = `${currentSessionData.accuracyRate}%`;
    } else {
        console.error('找不到accuracy-rate元素');
    }
    
    const weakPointsElement = document.getElementById('weak-points');
    if (weakPointsElement) {
        weakPointsElement.textContent = 
            currentSessionData.weakKnowledgePoints.length ? 
            currentSessionData.weakKnowledgePoints.join(', ') : '无';
    } else {
        console.error('找不到weak-points元素');
    }
}

// 初始化函数
async function initRecommendation() {
    console.log('初始化智能推荐模块...');
    // 先加载题库
    const bankLoaded = await loadQuestionBank();
    console.log('题库加载状态:', bankLoaded);
    if (!bankLoaded) return;
    
    // 分析本次答题数据
    console.log('开始分析答题数据...');
    analyzeCurrentSession();
    
    // 生成推荐
    console.log('开始生成推荐题目...');
    generateRecommendations();
    
    // 显示统计信息
    console.log('显示统计信息...');
    const accuracyElement = document.getElementById('accuracy-rate');
    const weakPointsElement = document.getElementById('weak-points');
    
    if (accuracyElement) {
        accuracyElement.textContent = `${currentSessionData.accuracyRate}%`;
    } else {
        console.error('找不到accuracy-rate元素');
    }
    
    if (weakPointsElement) {
        weakPointsElement.textContent = 
            currentSessionData.weakKnowledgePoints.length ? 
            currentSessionData.weakKnowledgePoints.join(', ') : '无';
    } else {
        console.error('找不到weak-points元素');
    }
    
    console.log('智能推荐初始化完成');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化智能推荐');
    initRecommendation();
});