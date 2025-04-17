// 存储题库
let questionBank = null;

// 存储用户答案
let userAnswers = {
    preTest: {},
    postTest: {}
};
let questionScores = {
    preTest: [],  // 课前练习题目得分记录
    postTest: []  // 课后习题题目得分记录
};


// 加载题库
async function loadQuestionBank() {
    try {
        console.log('开始从外部JSON文件加载题库...');
        const response = await fetch('assets/questions/question-bank.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        questionBank = await response.json();
        console.log('题库数据加载成功:', questionBank);
        
        // 初始化题目显示
        const currentPath = window.location.pathname;
        console.log('当前页面路径:', currentPath);
        
        if (currentPath.includes('pre-test.html')) {
            console.log('初始化课前练习题目...');
            initializePreTest();
            setupFilterButtons('preTest');
        } else if (currentPath.includes('post-test.html')) {
            console.log('初始化课后习题...');
            initializePostTest();
            setupFilterButtons('postTest');
        }
    } catch (error) {
        console.error('加载题库失败:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <p>加载题库失败: ${error.message}</p>
            <button onclick="location.reload()">重试</button>
        `;
        const container = document.querySelector('.test-container');
        if (container) {
            container.prepend(errorMessage);
        } else {
            console.error('找不到题目容器');
        }
    }
}

// 设置过滤按钮
function setupFilterButtons(testType) {
    // 基本题型过滤
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(btn => {
        btn.onclick = function() {
            const type = this.getAttribute('data-type') || 'all';
            filterQuestions(type);
        };
    });
    
    // 添加难度和知识点过滤器
    const filterContainer = document.querySelector('.question-filter-container');
    if (filterContainer) {
        // 获取所有难度和知识点
        const difficulties = new Set();
        const knowledgePoints = new Set();
        
        questionBank[testType].questions.forEach(question => {
            if (question.difficulty) difficulties.add(question.difficulty);
            if (question.knowledgePoint) knowledgePoints.add(question.knowledgePoint);
        });
        
        // 创建难度过滤器
        if (difficulties.size > 0) {
            const difficultyFilter = document.createElement('div');
            difficultyFilter.className = 'filter-group';
            difficultyFilter.innerHTML = `
                <label>难度:</label>
                <select id="difficulty-filter" onchange="filterByAttribute('difficulty', this.value)">
                    <option value="all">全部</option>
                    ${Array.from(difficulties).map(diff => `<option value="${diff}">${getDifficultyLabel(diff)}</option>`).join('')}
                </select>
            `;
            filterContainer.appendChild(difficultyFilter);
        }
        
        // 创建知识点过滤器
        if (knowledgePoints.size > 0) {
            const knowledgeFilter = document.createElement('div');
            knowledgeFilter.className = 'filter-group';
            knowledgeFilter.innerHTML = `
                <label>知识点:</label>
                <select id="knowledge-filter" onchange="filterByAttribute('knowledgePoint', this.value)">
                    <option value="all">全部</option>
                    ${Array.from(knowledgePoints).map(point => `<option value="${point}">${point}</option>`).join('')}
                </select>
            `;
            filterContainer.appendChild(knowledgeFilter);
        }
    }
}

// 获取难度标签
function getDifficultyLabel(difficulty) {
    switch(difficulty) {
        case 'easy': return '简单题';
        case 'medium': return '中档题';
        case 'hard': return '思考题';
        default: return difficulty;
    }
}

// 按属性过滤题目
function filterByAttribute(attribute, value) {
    const questions = document.querySelectorAll('.question-card');
    
    questions.forEach(question => {
        if (value === 'all' || question.dataset[attribute] === value) {
            // 保持当前的类型过滤状态
            const currentTypeFilter = document.querySelector('.type-btn.active').getAttribute('data-type') || 'all';
            if (currentTypeFilter === 'all' || question.dataset.type === currentTypeFilter) {
                question.style.display = 'block';
            }
        } else {
            question.style.display = 'none';
        }
    });
}

// 初始化课前练习题目
function initializePreTest() {
    console.log('开始初始化课前练习题目');
    if (!questionBank?.preTest?.questions) {
        console.error('题库数据不完整:', questionBank);
        return;
    }
    
    const container = document.querySelector('.test-container');
    if (!container) {
        console.error('找不到test-container');
        return;
    }
    
    const questionList = container.querySelector('.question-list');
    if (!questionList) {
        console.error('找不到question-list');
        return;
    }
    
    console.log('清空现有题目...');
    questionList.innerHTML = '';
    
    console.log('开始添加题目...');
    questionBank.preTest.questions.forEach((question, index) => {
        console.log(`添加第${index + 1}题:`, question);
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card';
        questionElement.dataset.type = question.type;
        questionElement.dataset.difficulty = question.difficulty;
        questionElement.dataset.knowledgePoint = question.knowledgePoint;
        
        // 处理问题图片
        const questionImage = question.image ? `<div class="question-image"><img src="${question.image}" alt="问题图片"></div>` : '';
        
        let questionContent = '';
        if (question.type === 'choice') {
            const options = question.options.map(opt => `
                <label class="option" style="display: block; margin-bottom: 5px;">
                    <input type="radio" name="${question.id}" value="${opt.label}" onchange="saveAnswer('preTest', '${question.id}', this.value)">
                    <span class="option-text">${opt.label}. ${opt.text}</span>
                </label>
            `).join('');
            
            questionContent = `
                <div class="question">
                    <p><span class="question-type">选择题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>
                    ${questionImage}
                    <div class="options">${options}</div>
                </div>
            `;
        } else if (question.type === 'fill') {
            // 新的填空题处理方式：统一使用数组答案
            // 计算空格数量
            const blankCount = (question.question.match(/____/g) || []).length;
            
            if (blankCount <= 1) {
                // 单空格显示方式
                const [before, after] = question.question.split('____');
                questionContent = `
                    <div class="question">
                        <div class="fill-question">
                            <p><span class="question-type">填空题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${before}<input type="text" class="fill-blank" name="${question.id}_1" data-index="1" style="width: 100px; margin: 0 5px;" 
                                   oninput="saveBlankAnswer('preTest', '${question.id}', 1, this.value)">${after || ''}</p>
                        </div>
                        ${questionImage}
                    </div>
                `;
            } else {
                // 多空格显示方式
                // 在问题文本中显示原始问题
                let displayQuestion = `<p><span class="question-type">填空题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>`;
                
                // 为每个空格创建输入区域
                let answerArea = `<div class="fill-blanks-answer-area">`;
                
                // 计算答案数组的长度，确保每个空格都有对应的输入框
                let answerCount = Array.isArray(question.answer) ? question.answer.length : blankCount;
                
                for (let i = 1; i <= answerCount; i++) {
                    answerArea += `
                        <div class="fill-blank-item">
                            <label>空格 ${i}:</label>
                            <input type="text" class="fill-blank" name="${question.id}_${i}" 
                                   data-index="${i}" style="width: 150px; margin: 5px;" 
                                   oninput="saveBlankAnswer('preTest', '${question.id}', ${i}, this.value)">
                        </div>
                    `;
                }
                answerArea += `</div>`;
                
                questionContent = `
                    <div class="question">
                        <div class="fill-question">
                            ${displayQuestion}
                            ${questionImage}
                            ${answerArea}
                        </div>
                    </div>
                `;
            }
        } else if (question.type === 'completion') {
            // 综合题处理
            const subQuestions = question.subQuestions.map((subQ, subIndex) => {
                let subQuestionContent = '';
                
                if (subQ.question.includes('____')) {
                    // 填空子题 - 使用统一数组答案处理
                    const blankCount = (subQ.question.match(/____/g) || []).length;
                    
                    if (blankCount <= 1) {
                        // 单个空格的子题
                        const [before, after] = subQ.question.split('____');
                        subQuestionContent = `
                            <div class="sub-question-item">
                                <p>${before}<input type="text" class="fill-blank" name="${subQ.id}_1" data-index="1" style="width: 150px; margin: 0 5px;" 
                                   oninput="saveCompletionAnswer('preTest', '${question.id}', '${subQ.id}', this.value, true, 1)">${after || ''}</p>
                            </div>
                        `;
                    } else {
                        // 多个空格的子题
                        // 题目显示区
                        let displaySubQuestion = `<p>${subQ.question}</p>`;
                        
                        // 答题区 - 根据答案数组确定输入框数量
                        let answerArea = `<div class="fill-blanks-answer-area">`;
                        
                        // 计算答案数组的长度
                        let answerCount = Array.isArray(subQ.answer) ? subQ.answer.length : blankCount;
                        
                        // 为每个答案创建输入框
                        for (let i = 1; i <= answerCount; i++) {
                            answerArea += `
                                <div class="fill-blank-item">
                                    <label>空格 ${i}:</label>
                                    <input type="text" class="fill-blank" name="${subQ.id}_${i}" 
                                           data-index="${i}" style="width: 150px; margin: 5px;" 
                                           oninput="saveCompletionAnswer('preTest', '${question.id}', '${subQ.id}', this.value, true, ${i})">
                                </div>
                            `;
                        }
                        answerArea += `</div>`;
                        
                        subQuestionContent = `
                            <div class="sub-question-item">
                                ${displaySubQuestion}
                                ${answerArea}
                            </div>
                        `;
                    }
                } else if (subQ.options) {
                    // 选择子题
                    const options = subQ.options.map(opt => `
                        <label class="option" style="display: block; margin-bottom: 5px;">
                            <input type="radio" name="${subQ.id}" value="${opt.label}" onchange="saveCompletionAnswer('preTest', '${question.id}', '${subQ.id}', this.value)">
                            <span class="option-text">${opt.label}. ${opt.text}</span>
                        </label>
                    `).join('');
                    
                    subQuestionContent = `
                        <div class="sub-question-item">
                            <p>${subQ.question}</p>
                            <div class="options">${options}</div>
                        </div>
                    `;
                } else {
                    // 解答子题
                    subQuestionContent = `
                        <div class="sub-question-item">
                            <p>${subQ.question}</p>
                            <textarea class="essay-answer" name="${subQ.id}" rows="3" placeholder="请在此输入您的答案..." 
                                      oninput="saveCompletionAnswer('preTest', '${question.id}', '${subQ.id}', this.value)"></textarea>
                        </div>
                    `;
                }
                
                return `
                    <div class="sub-question">
                        ${subQuestionContent}
                        <div id="result-${subQ.id}" class="result-container" style="display: none;"></div>
                    </div>
                `;
            }).join('');
            
            questionContent = `
                <div class="question">
                    <p><span class="question-type">综合题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>
                    ${questionImage}
                    <div class="sub-questions-container">
                        ${subQuestions}
                    </div>
                </div>
            `;
        }
        
        questionElement.innerHTML = `
            ${questionContent}
            <div id="result-${question.id}" class="result-container" style="display: none;"></div>
        `;
        questionList.appendChild(questionElement);
    });
    console.log('课前练习题目初始化完成');
}

// 初始化课后练习题目
function initializePostTest() {
    console.log('开始初始化课后练习题目');
    if (!questionBank?.postTest?.questions) {
        console.error('题库数据不完整:', questionBank);
        return;
    }
    
    const container = document.querySelector('.test-container');
    if (!container) {
        console.error('找不到test-container');
        return;
    }
    
    const questionList = container.querySelector('.question-list');
    if (!questionList) {
        console.error('找不到question-list');
        return;
    }
    
    console.log('清空现有题目...');
    questionList.innerHTML = '';
    
    console.log('开始添加题目...');
    questionBank.postTest.questions.forEach((question, index) => {
        console.log(`添加第${index + 1}题:`, question);
        const questionElement = document.createElement('div');
        questionElement.className = 'question-card';
        questionElement.dataset.type = question.type;
        questionElement.dataset.difficulty = question.difficulty;
        questionElement.dataset.knowledgePoint = question.knowledgePoint;
        
        // 处理问题图片
        const questionImage = question.image ? `<div class="question-image"><img src="${question.image}" alt="问题图片"></div>` : '';
        
        let questionContent = '';
        if (question.type === 'choice') {
            const options = question.options.map(opt => `
                <label class="option" style="display: block; margin-bottom: 5px;">
                    <input type="radio" name="${question.id}" value="${opt.label}" onchange="saveAnswer('postTest', '${question.id}', this.value)">
                    <span class="option-text">${opt.label}. ${opt.text}</span>
                </label>
            `).join('');
            
            questionContent = `
                <div class="question">
                    <p><span class="question-type">选择题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>
                    ${questionImage}
                    <div class="options">${options}</div>
                </div>
            `;
        } else if (question.type === 'fill') {
            // 新的填空题处理方式：统一使用数组答案
            // 计算空格数量
            const blankCount = (question.question.match(/____/g) || []).length;
            
            if (blankCount <= 1) {
                // 单空格显示方式
                const [before, after] = question.question.split('____');
                questionContent = `
                    <div class="question">
                        <div class="fill-question">
                            <p><span class="question-type">填空题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${before}<input type="text" class="fill-blank" name="${question.id}_1" data-index="1" style="width: 100px; margin: 0 5px;" 
                                   oninput="saveBlankAnswer('postTest', '${question.id}', 1, this.value)">${after || ''}</p>
                        </div>
                        ${questionImage}
                    </div>
                `;
            } else {
                // 多空格显示方式
                // 在问题文本中显示原始问题
                let displayQuestion = `<p><span class="question-type">填空题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>`;
                
                // 为每个空格创建输入区域
                let answerArea = `<div class="fill-blanks-answer-area">`;
                
                // 计算答案数组的长度，确保每个空格都有对应的输入框
                let answerCount = Array.isArray(question.answer) ? question.answer.length : blankCount;
                
                for (let i = 1; i <= answerCount; i++) {
                    answerArea += `
                        <div class="fill-blank-item">
                            <label>空格 ${i}:</label>
                            <input type="text" class="fill-blank" name="${question.id}_${i}" 
                                   data-index="${i}" style="width: 150px; margin: 5px;" 
                                   oninput="saveBlankAnswer('postTest', '${question.id}', ${i}, this.value)">
                        </div>
                    `;
                }
                answerArea += `</div>`;
                
                questionContent = `
                    <div class="question">
                        <div class="fill-question">
                            ${displayQuestion}
                            ${questionImage}
                            ${answerArea}
                        </div>
                    </div>
                `;
            }
        } else if (question.type === 'essay') {
            questionContent = `
                <div class="question">
                    <p><span class="question-type">简答题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>
                    ${questionImage}
                    <textarea class="essay-answer" name="${question.id}" rows="5" placeholder="请在此输入您的答案..." 
                              oninput="saveAnswer('postTest', '${question.id}', this.value)"></textarea>
                </div>
            `;
        } else if (question.type === 'completion') {
            // 综合题处理
            const subQuestions = question.subQuestions.map((subQ, subIndex) => {
                let subQuestionContent = '';
                
                if (subQ.question.includes('____')) {
                    // 填空子题 - 使用统一数组答案处理
                    const blankCount = (subQ.question.match(/____/g) || []).length;
                    
                    if (blankCount <= 1) {
                        // 单个空格的子题
                        const [before, after] = subQ.question.split('____');
                        subQuestionContent = `
                            <div class="sub-question-item">
                                <p>${before}<input type="text" class="fill-blank" name="${subQ.id}_1" data-index="1" style="width: 150px; margin: 0 5px;" 
                                   oninput="saveCompletionAnswer('postTest', '${question.id}', '${subQ.id}', this.value, true, 1)">${after || ''}</p>
                            </div>
                        `;
                    } else {
                        // 多个空格的子题
                        // 题目显示区
                        let displaySubQuestion = `<p>${subQ.question}</p>`;
                        
                        // 答题区 - 根据答案数组确定输入框数量
                        let answerArea = `<div class="fill-blanks-answer-area">`;
                        
                        // 计算答案数组的长度
                        let answerCount = Array.isArray(subQ.answer) ? subQ.answer.length : blankCount;
                        
                        // 为每个答案创建输入框
                        for (let i = 1; i <= answerCount; i++) {
                            answerArea += `
                                <div class="fill-blank-item">
                                    <label>空格 ${i}:</label>
                                    <input type="text" class="fill-blank" name="${subQ.id}_${i}" 
                                           data-index="${i}" style="width: 150px; margin: 5px;" 
                                           oninput="saveCompletionAnswer('postTest', '${question.id}', '${subQ.id}', this.value, true, ${i})">
                                </div>
                            `;
                        }
                        answerArea += `</div>`;
                        
                        subQuestionContent = `
                            <div class="sub-question-item">
                                ${displaySubQuestion}
                                ${answerArea}
                            </div>
                        `;
                    }
                } else if (subQ.options) {
                    // 选择子题
                    const options = subQ.options.map(opt => `
                        <label class="option" style="display: block; margin-bottom: 5px;">
                            <input type="radio" name="${subQ.id}" value="${opt.label}" onchange="saveCompletionAnswer('postTest', '${question.id}', '${subQ.id}', this.value)">
                            <span class="option-text">${opt.label}. ${opt.text}</span>
                        </label>
                    `).join('');
                    
                    subQuestionContent = `
                        <div class="sub-question-item">
                            <p>${subQ.question}</p>
                            <div class="options">${options}</div>
                        </div>
                    `;
                } else {
                    // 解答子题
                    subQuestionContent = `
                        <div class="sub-question-item">
                            <p>${subQ.question}</p>
                            <textarea class="essay-answer" name="${subQ.id}" rows="3" placeholder="请在此输入您的答案..." 
                                      oninput="saveCompletionAnswer('postTest', '${question.id}', '${subQ.id}', this.value)"></textarea>
                        </div>
                    `;
                }
                
                return `
                    <div class="sub-question">
                        ${subQuestionContent}
                        <div id="result-${subQ.id}" class="result-container" style="display: none;"></div>
                    </div>
                `;
            }).join('');
            
            questionContent = `
                <div class="question">
                    <p><span class="question-type">综合题</span> <span class="question-difficulty">${getDifficultyLabel(question.difficulty)}</span> ${question.question}</p>
                    ${questionImage}
                    <div class="sub-questions-container">
                        ${subQuestions}
                    </div>
                </div>
            `;
        }
        
        questionElement.innerHTML = `
            ${questionContent}
            <div id="result-${question.id}" class="result-container" style="display: none;"></div>
        `;
        questionList.appendChild(questionElement);
    });
    console.log('课后练习题目初始化完成');
}

// 保存用户答案
function saveAnswer(testType, questionId, answer) {
    if (!userAnswers[testType]) {
        userAnswers[testType] = {};
    }
    userAnswers[testType][questionId] = answer;
    console.log(`保存答案: ${testType} - ${questionId} - ${answer}`);
}

// 保存填空题答案（统一处理单空格和多空格）
function saveBlankAnswer(testType, questionId, blankIndex, answer) {
    if (!userAnswers[testType]) {
        userAnswers[testType] = {};
    }
    
    // 确保为该题目创建一个数组来存储答案
    if (!userAnswers[testType][questionId] || !Array.isArray(userAnswers[testType][questionId])) {
        userAnswers[testType][questionId] = [];
    }
    
    // 保存对应空格的答案（索引从0开始）
    userAnswers[testType][questionId][blankIndex - 1] = answer;
    console.log(`保存填空答案: ${testType} - ${questionId} - 空格${blankIndex} - ${answer}`);
}

// 保存综合题答案
function saveCompletionAnswer(testType, completionId, subQuestionId, answer, isBlank = false, blankIndex = null) {
    // 确保父级数据结构存在
    if (!userAnswers[testType]) {
        userAnswers[testType] = {};
    }
    
    // 确保综合题答案对象存在
    if (!userAnswers[testType][completionId]) {
        userAnswers[testType][completionId] = {
            type: 'completion',
            subAnswers: {}
        };
    }
    
    // 保存子问题答案
    if (isBlank) {
        // 填空型子问题 - 处理多空格情况
        if (!userAnswers[testType][completionId].subAnswers[subQuestionId]) {
            userAnswers[testType][completionId].subAnswers[subQuestionId] = [];
        }
        
        // 保存特定空格的答案
        userAnswers[testType][completionId].subAnswers[subQuestionId][blankIndex - 1] = answer;
        
        // 同时更新常规答案存储，以便与现有评分系统兼容
        saveBlankAnswer(testType, subQuestionId, blankIndex, answer);
    } else {
        // 选择题或简答题子问题
        userAnswers[testType][completionId].subAnswers[subQuestionId] = answer;
        
        // 同时更新常规答案存储，以便与现有评分系统兼容
        saveAnswer(testType, subQuestionId, answer);
    }
    
    console.log(`保存综合题答案: ${testType} - 综合题${completionId} - 子问题${subQuestionId} - ${isBlank ? `空格${blankIndex}` : ''} - ${answer}`);
}

// 题目过滤功能
function filterQuestions(type) {
    console.log('过滤题目类型:', type);
    const questions = document.querySelectorAll('.question-card');
    const typeButtons = document.querySelectorAll('.type-btn');
    
    typeButtons.forEach(btn => {
        btn.classList.remove('active');
        if ((btn.getAttribute('data-type') === type) || 
            (type === 'all' && btn.getAttribute('data-type') === 'all')) {
            btn.classList.add('active');
        }
    });
    
    questions.forEach(question => {
        // 考虑当前的难度和知识点过滤器
        const difficultyFilter = document.getElementById('difficulty-filter');
        const knowledgeFilter = document.getElementById('knowledge-filter');
        
        let showByDifficulty = true;
        let showByKnowledge = true;
        
        if (difficultyFilter && difficultyFilter.value !== 'all') {
            showByDifficulty = question.dataset.difficulty === difficultyFilter.value;
        }
        
        if (knowledgeFilter && knowledgeFilter.value !== 'all') {
            showByKnowledge = question.dataset.knowledgePoint === knowledgeFilter.value;
        }
        
        if ((type === 'all' || question.dataset.type === type) && showByDifficulty && showByKnowledge) {
            question.style.display = 'block';
        } else {
            question.style.display = 'none';
        }
    });
}

// 检查答案
function checkAnswer(testType, questionId, userAnswer) {
    console.log('检查答案:', testType, questionId, userAnswer);
    if (!questionBank) {
        console.error('题库未加载');
        return false;
    }

    const questions = questionBank[testType].questions;
    let question = questions.find(q => q.id === questionId);
    
    // 如果没有找到，可能是子问题，查找父问题
    if (!question) {
        for (const q of questions) {
            if (q.type === 'completion' && q.subQuestions) {
                const subQuestion = q.subQuestions.find(sq => sq.id === questionId);
                if (subQuestion) {
                    question = subQuestion;
                    break;
                }
            }
        }
    }
    
    if (!question) {
        console.error('题目未找到:', questionId);
        return false;
    }

    console.log('正确答案:', question.answer);

    // 如果传入的userAnswer是空的或undefined，检查是否存在综合题结构中的答案
    if (!userAnswer && testType && questionId) {
        // 尝试在userAnswers中找出这个问题属于哪个综合题
        for (const [compId, compData] of Object.entries(userAnswers[testType])) {
            if (compData && compData.type === 'completion' && compData.subAnswers && 
                compData.subAnswers[questionId] !== undefined) {
                userAnswer = compData.subAnswers[questionId];
                console.log('从综合题结构中获取到答案:', userAnswer);
                break;
            }
        }
    }
    
    if (question.type === 'essay') {
        // 简答题评分
        const keyPoints = question.keyPoints || [];
        const matchedPoints = keyPoints.filter(point => 
            userAnswer.toLowerCase().includes(point.toLowerCase())
        ).length;
        const score = (matchedPoints / keyPoints.length) * 10;
        return {
            isEssay: true,
            score: score,
            maxScore: 10,
            keyPoints: keyPoints,
            explanation: question.explanation
        };
    } else if (question.type === 'fill') {
        // 填空题评分 - 统一使用数组处理
        let correctAnswers = [];
        
        // 处理答案数组
        if (Array.isArray(question.answer)) {
            correctAnswers = question.answer;
        } else if (typeof question.answer === 'string') {
            // 兼容旧格式：单一答案字符串转为数组
            correctAnswers = [question.answer];
        } else {
            // 兼容旧格式：检查answer1, answer2等
            if (question.answer1 !== undefined) {
                correctAnswers.push(question.answer1);
                if (question.answer2 !== undefined) {
                    correctAnswers.push(question.answer2);
                }
            }
        }
        
        // 确保userAnswer是数组
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        
        // 比较用户答案和正确答案
        const totalBlanks = Math.max(userAnswerArray.length, correctAnswers.length);
        let correctCount = 0;
        
        for (let i = 0; i < totalBlanks; i++) {
            const userAns = (userAnswerArray[i] || '').trim().toLowerCase();
            const correctAns = (correctAnswers[i] || '').trim().toLowerCase();
            if (userAns === correctAns) {
                correctCount++;
            }
        }
        
        const isAllCorrect = correctCount === totalBlanks;
        
        return {
            isEssay: false,
            isMultipleBlanks: true,
            isCorrect: isAllCorrect,
            correctAnswers: correctAnswers,
            userAnswers: userAnswerArray,
            correctCount: correctCount,
            totalBlanks: totalBlanks,
            explanation: question.explanation,
            questionId: questionId,
            questionType: question.type,
            knowledgePoints: question.knowledgePoint || [],
            difficulty: question.difficulty,
            timestamp: new Date().toISOString()
        };
    } else {
        // 选择题评分
        const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
        return {
            isEssay: false,
            isCorrect: isCorrect,
            correctAnswer: question.answer,
            userAnswer: userAnswer,
            explanation: question.explanation
        };
    }
}

// 显示答案结果
function displayResult(questionId, result) {
    const resultContainer = document.getElementById(`result-${questionId}`);
    if (!resultContainer) return;
    
    let resultHtml = '';
    if (result.isEssay) {
        resultHtml = `
            <div class="result-item">
                <p>得分：${result.score.toFixed(1)}/${result.maxScore}</p>
                <p class="explanation">参考答案要点：</p>
                <ul>
                    ${result.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
                <p class="explanation">${result.explanation}</p>
            </div>
        `;
    } else if (result.isMultipleBlanks) {
        // 多空格题目结果显示
        if (result.isCorrect) {
            resultHtml = `
                <div class="result-item correct">
                    <p>✨ 恭喜你答对了！</p>
                    <p class="explanation">${result.explanation}</p>
                </div>
            `;
        } else {
            // 显示每个空的正确答案
            let blankResults = '';
            for (let i = 0; i < result.totalBlanks; i++) {
                // 确保使用的是当前题目的用户答案，而不是混淆其他题目的答案
                const userAns = result.userAnswers[i] || '';
                const correctAns = result.correctAnswers[i] || '';
                const isCorrect = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
                
                blankResults += `
                    <div class="blank-result ${isCorrect ? 'correct' : 'incorrect'}">
                        <span>空格 ${i + 1}:</span>
                        <span>你的答案: ${userAns}</span>
                        <span>正确答案: ${correctAns}</span>
                    </div>
                `;
            }
            
            resultHtml = `
                <div class="result-item partial">
                    <p>部分正确 (${result.correctCount}/${result.totalBlanks})</p>
                    <div class="blank-results">
                        ${blankResults}
                    </div>
                    <p class="explanation">${result.explanation}</p>
                </div>
            `;
        }
    } else if (result.isCorrect) {
        resultHtml = `
            <div class="result-item correct">
                <p>✨ 恭喜你答对了！</p>
                <p class="explanation">${result.explanation}</p>
            </div>
        `;
    } else {
        resultHtml = `
            <div class="result-item incorrect">
                <p>❌ 答案不正确</p>
                <p>正确答案：${result.correctAnswer}</p>
                <p>你的答案：${result.userAnswer || ''}</p>
                <p class="explanation">${result.explanation}</p>
            </div>
        `;
    }
    
    resultContainer.innerHTML = resultHtml;
    resultContainer.style.display = 'block';
    
    resultContainer.style.opacity = '0';
    resultContainer.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        resultContainer.style.transition = 'all 0.3s ease-in-out';
        resultContainer.style.opacity = '1';
        resultContainer.style.transform = 'translateY(0)';
    }, 50);
}

// 提交课前练习
function submitPreTest() {
    console.log('提交课前练习答案...');
    if (!questionBank) {
        console.log('题库未加载，重新加载题库...');
        loadQuestionBank();
        return;
    }

    const preTestQuestions = questionBank.preTest.questions;
    console.log('题目总数:', preTestQuestions.length);
    
    // 检查是否所有题目都已完成
    let allCompleted = true;
    let incompleteQuestions = [];
    
    for (const question of preTestQuestions) {
        if (question.type === 'completion') {
            // 对于综合题，检查每个子问题
            for (const subQ of question.subQuestions) {
                // 首先检查旧格式的答案
                let hasAnswer = !!userAnswers.preTest[subQ.id];
                
                // 然后检查新格式的答案（综合题结构）
                if (!hasAnswer && 
                    userAnswers.preTest[question.id] && 
                    userAnswers.preTest[question.id].type === 'completion' && 
                    userAnswers.preTest[question.id].subAnswers) {
                    hasAnswer = userAnswers.preTest[question.id].subAnswers[subQ.id] !== undefined;
                }
                
                if (!hasAnswer) {
                    allCompleted = false;
                    incompleteQuestions.push(subQ.id);
                }
            }
        } else if (!userAnswers.preTest[question.id]) {
            allCompleted = false;
            incompleteQuestions.push(question.id);
        }
    }
    
    if (!allCompleted) {
        console.log('有未完成的题目:', incompleteQuestions);
        alert(`请完成所有题目后再提交！还有 ${incompleteQuestions.length} 道题目未完成。`);
        return;
    }
    
    // 评分并显示结果
    let allCorrect = true;
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    for (const question of preTestQuestions) {
        if (question.type === 'completion') {
            // 对综合题的每个子问题进行评分
            for (const subQ of question.subQuestions) {
                totalQuestions++;
                
                // 获取用户答案 - 兼容新旧两种数据结构
                let userAnswer = userAnswers.preTest[subQ.id];
                
                // 如果在旧结构中找不到，尝试在新的综合题结构中查找
                if (userAnswer === undefined && 
                    userAnswers.preTest[question.id] && 
                    userAnswers.preTest[question.id].type === 'completion' && 
                    userAnswers.preTest[question.id].subAnswers) {
                    userAnswer = userAnswers.preTest[question.id].subAnswers[subQ.id];
                }
                
                // 确保当前子问题的用户答案正确传递
                if (userAnswer === undefined) {
                    console.warn(`未找到子问题 ${subQ.id} 的用户答案`);
                    continue;
                }
                
                console.log(`评分子问题: ${subQ.id}, 用户答案:`, userAnswer);
                const result = checkAnswer('preTest', subQ.id, userAnswer);
                
                if (result.isEssay) {
                    if (result.score < result.maxScore) {
                        allCorrect = false;
                    } else {
                        totalCorrect++;
                    }
                } else {
                    if (result.isCorrect) {
                        totalCorrect++;
                    } else {
                        allCorrect = false;
                    }
                }
                
                displayResult(subQ.id, result);
            }
        } else {
            totalQuestions++;
            const userAnswer = userAnswers.preTest[question.id];
            // 确保题目的用户答案正确传递
            if (!userAnswer) {
                console.warn(`未找到问题 ${question.id} 的用户答案`);
                continue;
            }
            
            console.log(`评分问题: ${question.id}, 用户答案:`, userAnswer);
            const result = checkAnswer('preTest', question.id, userAnswer);
            
            if (result.isEssay) {
                if (result.score < result.maxScore) {
                    allCorrect = false;
                } else {
                    totalCorrect++;
                }
            } else {
                if (result.isCorrect) {
                    totalCorrect++;
                } else {
                    allCorrect = false;
                }
            }
            
            displayResult(question.id, result);
        }
    }
    
    // 显示总结
    const summaryContainer = document.getElementById('test-summary');
    if (summaryContainer) {
        const percentage = (totalCorrect / totalQuestions) * 100;
        summaryContainer.innerHTML = `
            <div class="test-summary ${allCorrect ? 'all-correct' : ''}">
                <h3>测试完成！</h3>
                <p>得分：${percentage.toFixed(1)}%（${totalCorrect}/${totalQuestions}）</p>
                ${allCorrect ? '<p class="congratulations">🎉 太棒了！你已经完全掌握了这部分内容！</p>' : ''}
            </div>
        `;
        summaryContainer.style.display = 'block';
    }
}

// 提交课后习题
function submitPostTest() {
    console.log('提交课后习题答案...');
    if (!questionBank) {
        console.log('题库未加载，重新加载题库...');
        loadQuestionBank();
        return;
    }

    const postTestQuestions = questionBank.postTest.questions;
    console.log('题目总数:', postTestQuestions.length);
    
    // 检查是否所有题目都已完成
    let allCompleted = true;
    let incompleteQuestions = [];
    
    for (const question of postTestQuestions) {
        if (question.type === 'completion') {
            // 对于综合题，检查每个子问题
            for (const subQ of question.subQuestions) {
                // 首先检查旧格式的答案
                let hasAnswer = !!userAnswers.postTest[subQ.id];
                
                // 然后检查新格式的答案（综合题结构）
                if (!hasAnswer && 
                    userAnswers.postTest[question.id] && 
                    userAnswers.postTest[question.id].type === 'completion' && 
                    userAnswers.postTest[question.id].subAnswers) {
                    hasAnswer = userAnswers.postTest[question.id].subAnswers[subQ.id] !== undefined;
                }
                
                if (!hasAnswer) {
                    allCompleted = false;
                    incompleteQuestions.push(subQ.id);
                }
            }
        } else if (!userAnswers.postTest[question.id]) {
            allCompleted = false;
            incompleteQuestions.push(question.id);
        }
    }
    
    if (!allCompleted) {
        console.log('有未完成的题目:', incompleteQuestions);
        alert(`请完成所有题目后再提交！还有 ${incompleteQuestions.length} 道题目未完成。`);
        return;
    }
    
    // 评分并显示结果
    let totalPoints = 0;
    let earnedPoints = 0;
    
    for (const question of postTestQuestions) {
        if (question.type === 'completion') {
            // 对综合题的每个子问题进行评分
            for (const subQ of question.subQuestions) {
                // 获取用户答案 - 兼容新旧两种数据结构
                let userAnswer = userAnswers.postTest[subQ.id];
                
                // 如果在旧结构中找不到，尝试在新的综合题结构中查找
                if (userAnswer === undefined && 
                    userAnswers.postTest[question.id] && 
                    userAnswers.postTest[question.id].type === 'completion' && 
                    userAnswers.postTest[question.id].subAnswers) {
                    userAnswer = userAnswers.postTest[question.id].subAnswers[subQ.id];
                }
                
                // 确保当前子问题的用户答案正确传递
                if (userAnswer === undefined) {
                    console.warn(`未找到子问题 ${subQ.id} 的用户答案`);
                    continue;
                }
                
                console.log(`评分子问题: ${subQ.id}, 用户答案:`, userAnswer);
                const result = checkAnswer('postTest', subQ.id, userAnswer);
                
                if (result.isEssay) {
                    totalPoints += 10;
                    earnedPoints += result.score;
                } else {
                    if (subQ.options) { // 选择题
                        totalPoints += 5;
                        if (result.isCorrect) earnedPoints += 5;
                    } else { // 填空题
                        totalPoints += 3;
                        if (result.isCorrect) earnedPoints += 3;
                    }
                }
                
                displayResult(subQ.id, result);
            }
        } else {
            const userAnswer = userAnswers.postTest[question.id];
            if (!userAnswer) {
                console.warn(`未找到问题 ${question.id} 的用户答案`);
                continue;
            }
            
            console.log(`评分问题: ${question.id}, 用户答案:`, userAnswer);
            const result = checkAnswer('postTest', question.id, userAnswer);
            recordQuestionScore('postTest', result);  // 新增这行
            if (result.isEssay) {
                totalPoints += 10;
                earnedPoints += result.score;
            } else {
                if (question.type === 'choice') {
                    totalPoints += 5;
                    if (result.isCorrect) earnedPoints += 5;
                } else if (question.type === 'fill') {
                    totalPoints += 3;
                    if (result.isCorrect) earnedPoints += 3;
                }
            }
            
            displayResult(question.id, result);
        }
    }
    
    // 显示总结
    const summaryContainer = document.getElementById('test-summary');
    if (summaryContainer) {
        const percentage = (earnedPoints / totalPoints) * 100;
        summaryContainer.innerHTML = `
            <div class="test-summary">
                <h3>测试完成！</h3>
                <p>得分：${earnedPoints.toFixed(1)}/${totalPoints} (${percentage.toFixed(1)}%)</p>
                ${percentage >= 90 ? '<p class="congratulations">🎉 太棒了！你已经很好地掌握了这部分内容！</p>' : 
                 percentage >= 70 ? '<p class="good">👍 不错！继续加油！</p>' :
                 '<p class="encouragement">💪 再接再厉，相信你可以做得更好！</p>'}
                <button id="view-recommendations" class="action-btn primary">查看推荐习题</button>
            </div>
        `;
        summaryContainer.style.display = 'block';
        
        // 为新添加的按钮添加点击事件
        const viewRecommendationsBtn = document.getElementById('view-recommendations');
        if (viewRecommendationsBtn) {
            viewRecommendationsBtn.addEventListener('click', function() {
                // 保存测试数据
                const quizSessionData = {
                    accuracy: percentage,
                    questions: postTestQuestions.map(question => ({
                        id: question.id,
                        type: question.type,
                        score: calculateQuestionScore(question),
                        knowledgePoints: question.knowledgePoint || [],
                        difficulty: question.difficulty,
                        timestamp: new Date().toISOString()
                    }))
                };
                localStorage.setItem('currentQuizData', JSON.stringify(quizSessionData));
                
                // 跳转到推荐页面
                const finalPercentage = typeof percentage !== 'undefined' ? percentage : (earnedPoints / totalPoints) * 100;
                window.location.href = '../smart-recommendation.html?from=post-test&score=' + finalPercentage.toFixed(1);
            });
        }
    }
}

// 保存进度
function saveProgress() {
    console.log('保存答题进度...');
    localStorage.setItem('savedAnswers', JSON.stringify(userAnswers));
    alert('进度已保存！');
}

// 加载已保存的进度
function loadSavedProgress() {
    console.log('加载已保存的进度...');
    const savedData = localStorage.getItem('savedAnswers');
    if (!savedData) return;
    
    try {
        const savedAnswers = JSON.parse(savedData);
        userAnswers = savedAnswers;
        
        // 恢复已保存的答案到界面
        const currentPath = window.location.pathname;
        const testType = currentPath.includes('pre-test.html') ? 'preTest' : 'postTest';
        
        if (userAnswers[testType]) {
            // 处理常规格式的答案
            Object.entries(userAnswers[testType]).forEach(([questionId, answer]) => {
                // 跳过综合题类型的父题目
                if (answer && typeof answer === 'object' && answer.type === 'completion') {
                    return;
                }
                
                // 处理数组答案（填空题）
                if (Array.isArray(answer)) {
                    answer.forEach((value, index) => {
                        const blankInput = document.querySelector(`input[name="${questionId}_${index + 1}"]`);
                        if (blankInput) {
                            blankInput.value = value || '';
                        }
                    });
                    return;
                }
                
                // 处理普通答案（选择题、简答题）
                const element = document.querySelector(`[name="${questionId}"]`);
                if (!element) return;
                
                if (element.type === 'radio') {
                    const radio = document.querySelector(`input[name="${questionId}"][value="${answer}"]`);
                    if (radio) radio.checked = true;
                } else if (element.tagName === 'TEXTAREA' || element.type === 'text') {
                    element.value = answer;
                }
            });
            
            // 处理综合题格式的答案
            Object.entries(userAnswers[testType]).forEach(([questionId, data]) => {
                if (data && typeof data === 'object' && data.type === 'completion' && data.subAnswers) {
                    // 处理每个子问题的答案
                    Object.entries(data.subAnswers).forEach(([subQuestionId, subAnswer]) => {
                        // 处理数组答案（填空题）
                        if (Array.isArray(subAnswer)) {
                            subAnswer.forEach((value, index) => {
                                const blankInput = document.querySelector(`input[name="${subQuestionId}_${index + 1}"]`);
                                if (blankInput) {
                                    blankInput.value = value || '';
                                }
                            });
                            return;
                        }
                        
                        // 处理普通答案（选择题、简答题）
                        const element = document.querySelector(`[name="${subQuestionId}"]`);
                        if (!element) return;
                        
                        if (element.type === 'radio') {
                            const radio = document.querySelector(`input[name="${subQuestionId}"][value="${subAnswer}"]`);
                            if (radio) radio.checked = true;
                        } else if (element.tagName === 'TEXTAREA' || element.type === 'text') {
                            element.value = subAnswer;
                        }
                    });
                }
            });
        }
        console.log('进度加载完成');
    } catch (error) {
        console.error('加载进度失败:', error);
    }
}

// 上传题目功能
function uploadQuestions() {
    const fileInput = document.getElementById('question-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择一个JSON文件上传');
        return;
    }
    
    const file = fileInput.files[0];
    if (file.type !== 'application/json') {
        alert('请上传JSON格式的文件');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const uploadedQuestions = JSON.parse(e.target.result);
            
            // 验证上传的题库格式
            if (!validateQuestionBank(uploadedQuestions)) {
                alert('上传的题库格式不正确，请检查后重试');
                return;
            }
            
            // 合并题库
            if (questionBank) {
                // 确定当前是哪种测试类型
                const currentPath = window.location.pathname;
                const testType = currentPath.includes('pre-test.html') ? 'preTest' : 'postTest';
                
                // 合并题目
                if (uploadedQuestions[testType] && uploadedQuestions[testType].questions) {
                    questionBank[testType].questions = [
                        ...questionBank[testType].questions,
                        ...uploadedQuestions[testType].questions
                    ];
                    
                    // 重新初始化题目
                    if (testType === 'preTest') {
                        initializePreTest();
                    } else {
                        initializePostTest();
                    }
                    
                    alert('题目上传成功！');
                } else {
                    alert(`上传的题库中没有${testType === 'preTest' ? '课前练习' : '课后习题'}的题目`);
                }
            } else {
                alert('题库尚未加载，请刷新页面后重试');
            }
        } catch (error) {
            console.error('解析上传的题库失败:', error);
            alert('解析上传的题库失败: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// 验证题库格式
function validateQuestionBank(questionBank) {
    // 简单验证，确保基本结构正确
    if (!questionBank.preTest && !questionBank.postTest) {
        return false;
    }
    
    if (questionBank.preTest && (!Array.isArray(questionBank.preTest.questions) || questionBank.preTest.questions.length === 0)) {
        return false;
    }
    
    if (questionBank.postTest && (!Array.isArray(questionBank.postTest.questions) || questionBank.postTest.questions.length === 0)) {
        return false;
    }
    
    return true;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，开始初始化...');
    await loadQuestionBank();
    loadSavedProgress();
});

function recordQuestionScore(testType, result) {
    if (!questionScores[testType]) {
        questionScores[testType] = [];
    }
    
    // 计算得分百分比
    let scorePercentage = 0;
    if (result.isEssay) {
        scorePercentage = (result.score / result.maxScore) * 100;
    } else if (result.isMultipleBlanks) {
        scorePercentage = (result.correctCount / result.totalBlanks) * 100;
    } else {
        scorePercentage = result.isCorrect ? 100 : 0;
    }
    
    // 记录得分数据
    questionScores[testType].push({
        id: result.questionId,
        type: result.questionType,
        score: scorePercentage,
        knowledgePoints: result.knowledgePoints,
        difficulty: result.difficulty,
        timestamp: result.timestamp,
        details: result  // 包含原始评分细节
    });
    
}

function calculateQuestionScore(question) {
    if (question.type === 'completion') {
        let correctCount = 0;
        question.subQuestions.forEach(subQ => {
            const result = checkAnswer('postTest', subQ.id, 
                userAnswers.postTest[subQ.id] || 
                (userAnswers.postTest[question.id]?.subAnswers?.[subQ.id]));
            if (result.isCorrect) correctCount++;
        });
        return (correctCount / question.subQuestions.length) * 100;
    } else {
        const result = checkAnswer('postTest', question.id, userAnswers.postTest[question.id]);
        return result.isCorrect ? 100 : 0;
    }
}