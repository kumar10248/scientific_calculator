// Enhanced calculator with advanced functionality
let history = [];
let memory = 0;
let angleMode = 'deg'; // 'deg' or 'rad'
let lastResult = null;

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', function() {
	const display = document.getElementById("display");
	
	// Keyboard support
	document.addEventListener('keydown', handleKeyboard);
	
	// Add haptic feedback to all buttons - use both click and touchstart for better mobile support
	const allButtons = document.querySelectorAll('button');
	allButtons.forEach(button => {
		// Use touchstart for immediate mobile response
		button.addEventListener('touchstart', function(e) {
			hapticFeedback(15);
		}, { passive: true });
		
		// Also add to click for desktop compatibility
		button.addEventListener('click', function(e) {
			hapticFeedback(15);
		}, { passive: true });
	});
	
	// Prevent default behavior for certain keys
	display.addEventListener('keypress', function(e) {
		const allowedKeys = /[0-9+\-*/.()%^!epi]/;
		if (!allowedKeys.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace') {
			e.preventDefault();
		}
	});
	
	// Load saved history from localStorage
	loadHistory();
	
	// Load saved memory from localStorage
	loadMemory();
});

function handleKeyboard(e) {
	// Don't handle keyboard if user is typing in an input, textarea, or select element
	const activeElement = document.activeElement;
	const isInputField = activeElement && (
		activeElement.tagName === 'INPUT' ||
		activeElement.tagName === 'TEXTAREA' ||
		activeElement.tagName === 'SELECT'
	);
	
	// If typing in any input field (including modal inputs), don't capture the keypress
	if (isInputField && activeElement.id !== 'display') {
		return;
	}
	
	const display = document.getElementById("display");
	
	// Number and operator keys
	if (/^[0-9+\-*/.()%^]$/.test(e.key)) {
		display.value += e.key;
		animateDisplay();
	}
	
	// Enter or = for calculate
	if (e.key === 'Enter' || e.key === '=') {
		e.preventDefault();
		calculate();
	}
	
	// Backspace
	if (e.key === 'Backspace' && !display.value) {
		e.preventDefault();
	}
	
	// Escape for clear
	if (e.key === 'Escape') {
		display.value = '';
		document.getElementById('history').textContent = '';
		animateDisplay();
	}
	
	// Delete for clear all
	if (e.key === 'Delete') {
		display.value = '';
		document.getElementById('history').textContent = '';
		animateDisplay();
	}
}

function backspace() {
	let display = document.getElementById("display");
	display.value = display.value.slice(0, -1);
	animateDisplay();
}

function calculate() {
	let display = document.getElementById("display");
	let historyDisplay = document.getElementById("history");
	let expression = display.value;
	let result;

	if (!expression) return;

	try {
		// Store the expression for history
		let originalExpression = expression;
		
		// Handle percentage calculations
		expression = handlePercentage(expression);
		
		// Convert log to log10 for base-10 logarithm (math.js uses log for natural log)
		expression = expression.replace(/\blog\(/g, 'log10(');
		
		// Convert ln to log for natural logarithm in math.js
		expression = expression.replace(/\bln\(/g, 'log(');
		
		// Convert trigonometric functions based on angle mode
		if (angleMode === 'deg') {
			expression = expression.replace(/\bsin\(/g, 'sin(' + (Math.PI / 180) + '*');
			expression = expression.replace(/\bcos\(/g, 'cos(' + (Math.PI / 180) + '*');
			expression = expression.replace(/\btan\(/g, 'tan(' + (Math.PI / 180) + '*');
		}
		
		// Handle factorial
		expression = handleFactorial(expression);
		
		// Handle absolute value
		expression = expression.replace(/\|([^|]+)\|/g, 'abs($1)');

		result = math.evaluate(expression);
		
		// Round to avoid floating point errors
		if (typeof result === 'number') {
			result = Math.round(result * 1e10) / 1e10;
		}
		
		// Update history
		historyDisplay.textContent = originalExpression + ' =';
		history.unshift({ expression: originalExpression, result: result, timestamp: new Date() });
		
		// Keep only last 50 history items
		if (history.length > 50) {
			history = history.slice(0, 50);
		}
		
		saveHistory();
		
		// Store last result
		lastResult = result;
		
		// Animate result
		display.value = '';
		animateResult(result.toString(), display);
		
		// Add success animation and haptic feedback
		display.parentElement.classList.add('success-flash');
		hapticFeedback(30); // Medium vibration on successful calculation
		setTimeout(() => {
			display.parentElement.classList.remove('success-flash');
		}, 300);
		
	} catch (error) {
		console.error('Calculation error:', error);
		display.value = "Error";
		display.parentElement.classList.add('error-flash');
		hapticFeedback(100); // Stronger vibration on error
		setTimeout(() => {
			display.parentElement.classList.remove('error-flash');
			display.value = '';
		}, 1500);
	}
}

function handlePercentage(expr) {
	// Convert percentage to decimal (e.g., 50% becomes 0.5)
	return expr.replace(/(\d+\.?\d*)%/g, '($1/100)');
}

function handleFactorial(expr) {
	// Replace factorial notation with math.js factorial function
	// Handle cases like 5!, (3+2)!, etc.
	return expr.replace(/(\d+(?:\.\d+)?|\([^)]+\))!/g, 'factorial($1)');
}

function animateResult(text, element) {
	let index = 0;
	const interval = setInterval(() => {
		if (index < text.length) {
			element.value += text[index];
			index++;
		} else {
			clearInterval(interval);
		}
	}, 30);
}

// Haptic feedback for mobile devices
function hapticFeedback(intensity = 10) {
	try {
		// Check if the Vibration API is supported
		if (typeof navigator.vibrate === 'function') {
			navigator.vibrate(intensity);
			return true;
		} else if (typeof navigator.webkitVibrate === 'function') {
			// Fallback for older webkit browsers
			navigator.webkitVibrate(intensity);
			return true;
		} else if (typeof navigator.mozVibrate === 'function') {
			// Fallback for Firefox
			navigator.mozVibrate(intensity);
			return true;
		}
		return false;
	} catch (e) {
		console.error('Vibration error:', e);
		return false;
	}
}

function animateDisplay() {
	let display = document.getElementById("display");
	display.style.transform = 'scale(0.98)';
	setTimeout(() => {
		display.style.transform = 'scale(1)';
	}, 100);
	hapticFeedback(15); // Light vibration on display animation
}

function squareRoot() {
	let display = document.getElementById("display");
	display.value += "sqrt(";
	animateDisplay();
}

function base10Log() {
	let display = document.getElementById("display");
	display.value += "log(";
	animateDisplay();
}

function pi() {
	let display = document.getElementById("display");
	display.value += "pi";
	animateDisplay();
}

function e() {
	let display = document.getElementById("display");
	display.value += "e";
	animateDisplay();
}

function power() {
	let display = document.getElementById("display");
	display.value += "^(";
	animateDisplay();
}

// Memory functions
function memoryStore() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			let value = math.evaluate(display.value);
			memory = value;
			saveMemory();
			showNotification('Memory Stored: ' + memory);
		} catch (e) {
			memory = lastResult || 0;
			saveMemory();
			showNotification('Memory Stored: ' + memory);
		}
	} else if (lastResult !== null) {
		memory = lastResult;
		saveMemory();
		showNotification('Memory Stored: ' + memory);
	}
}

function memoryRecall() {
	let display = document.getElementById("display");
	display.value += memory;
	animateDisplay();
	showNotification('Memory Recalled: ' + memory);
}

function memoryClear() {
	memory = 0;
	saveMemory();
	showNotification('Memory Cleared');
}

function memoryAdd() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			let value = math.evaluate(display.value);
			memory += value;
			saveMemory();
			showNotification('Added to Memory: ' + memory);
		} catch (e) {
			showNotification('Cannot add to memory - Invalid expression');
		}
	} else if (lastResult !== null) {
		memory += lastResult;
		saveMemory();
		showNotification('Added to Memory: ' + memory);
	}
}

function memorySubtract() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			let value = math.evaluate(display.value);
			memory -= value;
			saveMemory();
			showNotification('Subtracted from Memory: ' + memory);
		} catch (e) {
			showNotification('Cannot subtract from memory - Invalid expression');
		}
	} else if (lastResult !== null) {
		memory -= lastResult;
		saveMemory();
		showNotification('Subtracted from Memory: ' + memory);
	}
}

// Angle mode toggle
function toggleAngleMode() {
	angleMode = angleMode === 'deg' ? 'rad' : 'deg';
	showNotification('Angle Mode: ' + angleMode.toUpperCase());
	updateAngleModeButton();
}

function updateAngleModeButton() {
	const btn = document.getElementById('angle-mode-btn');
	if (btn) {
		btn.textContent = angleMode.toUpperCase();
	}
}

// History management
function showHistory() {
	if (history.length === 0) {
		showNotification('No history available');
		return;
	}
	
	let historyText = 'Calculation History:\n\n';
	history.slice(0, 10).forEach((item, index) => {
		historyText += `${index + 1}. ${item.expression} = ${item.result}\n`;
	});
	
	alert(historyText);
}

function clearHistory() {
	history = [];
	saveHistory();
	document.getElementById('history').textContent = '';
	displayHistoryList();
	showNotification('History Cleared', 'success');
}

function saveHistory() {
	try {
		localStorage.setItem('calcHistory', JSON.stringify(history));
	} catch (e) {
		console.error('Failed to save history:', e);
	}
}

function loadHistory() {
	try {
		const saved = localStorage.getItem('calcHistory');
		if (saved) {
			history = JSON.parse(saved);
		}
	} catch (e) {
		console.error('Failed to load history:', e);
	}
}

function saveMemory() {
	try {
		localStorage.setItem('calcMemory', memory.toString());
	} catch (e) {
		console.error('Failed to save memory:', e);
	}
}

function loadMemory() {
	try {
		const saved = localStorage.getItem('calcMemory');
		if (saved) {
			memory = parseFloat(saved) || 0;
		}
	} catch (e) {
		console.error('Failed to load memory:', e);
	}
}

// Advanced functions
function inverse() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			let value = math.evaluate(display.value);
			display.value = (1 / value).toString();
			animateDisplay();
			lastResult = parseFloat(display.value);
		} catch (e) {
			display.value = "Error";
			setTimeout(() => {
				display.value = '';
			}, 1500);
		}
	}
}

function square() {
	let display = document.getElementById("display");
	if (display.value) {
		display.value += "^(2)";
		animateDisplay();
	} else if (lastResult !== null) {
		display.value = lastResult + "^(2)";
		animateDisplay();
	}
}

function calculatePercentage() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			// If the display contains an expression, calculate the percentage
			const value = eval(display.value.replace(/\^/g, '**').replace(/×/g, '*').replace(/÷/g, '/'));
			display.value = (value / 100).toString();
			animateDisplay();
		} catch (e) {
			// If not a valid expression, just append /100
			display.value += "/100";
			animateDisplay();
		}
	} else if (lastResult !== null) {
		display.value = (lastResult / 100).toString();
		animateDisplay();
	}
}

function cube() {
	let display = document.getElementById("display");
	if (display.value) {
		display.value += "^(3)";
		animateDisplay();
	} else if (lastResult !== null) {
		display.value = lastResult + "^(3)";
		animateDisplay();
	}
}

function absolute() {
	let display = document.getElementById("display");
	display.value += "abs(";
	animateDisplay();
}

function naturalLog() {
	let display = document.getElementById("display");
	display.value += "ln(";
	animateDisplay();
}

// Notification system
function showNotification(message) {
	// Remove existing notification
	const existing = document.querySelector('.notification');
	if (existing) {
		existing.remove();
	}
	
	// Create notification
	const notification = document.createElement('div');
	notification.className = 'notification';
	notification.textContent = message;
	document.body.appendChild(notification);
	
	// Animate in
	setTimeout(() => {
		notification.classList.add('show');
	}, 10);
	
	// Remove after delay
	setTimeout(() => {
		notification.classList.remove('show');
		setTimeout(() => {
			notification.remove();
		}, 300);
	}, 2000);
}

// Use last result
function useLastResult() {
	if (lastResult !== null) {
		let display = document.getElementById("display");
		display.value += lastResult;
		animateDisplay();
	} else {
		showNotification('No previous result');
	}
}

// ======================================
// ADVANCED FUNCTIONS - STATISTICS & EQUATIONS
// ======================================

let currentStatsMode = '';
let currentEquationType = '';

// Open Advanced Menu
function openAdvancedMenu() {
	document.getElementById('advancedModal').style.display = 'flex';
}

function closeAdvancedMenu() {
	document.getElementById('advancedModal').style.display = 'none';
}

// Statistics Functions
function openStatistics(mode) {
	currentStatsMode = mode;
	closeAdvancedMenu();
	
	const titles = {
		'mean': 'Calculate Mean (Average)',
		'median': 'Calculate Median',
		'mode': 'Calculate Mode',
		'sd': 'Calculate Standard Deviation'
	};
	
	document.getElementById('statsTitle').textContent = titles[mode];
	document.getElementById('statsInput').value = '';
	document.getElementById('statsResult').innerHTML = '';
	document.getElementById('statsModal').style.display = 'flex';
}

function closeStatsModal() {
	document.getElementById('statsModal').style.display = 'none';
}

function calculateStatistics() {
	const input = document.getElementById('statsInput').value;
	const resultDiv = document.getElementById('statsResult');
	
	if (!input.trim()) {
		resultDiv.innerHTML = '<p class="error">Please enter numbers!</p>';
		return;
	}
	
	try {
		// Parse numbers from input
		const numbers = input.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
		
		if (numbers.length === 0) {
			resultDiv.innerHTML = '<p class="error">No valid numbers found!</p>';
			return;
		}
		
		let result;
		let explanation = '';
		
		switch(currentStatsMode) {
			case 'mean':
				result = calculateMean(numbers);
				explanation = `Sum: ${numbers.reduce((a, b) => a + b, 0)}<br>Count: ${numbers.length}`;
				break;
			case 'median':
				result = calculateMedian(numbers);
				explanation = `Sorted: [${[...numbers].sort((a, b) => a - b).join(', ')}]`;
				break;
			case 'mode':
				result = calculateMode(numbers);
				explanation = result.explanation;
				result = result.mode;
				break;
			case 'sd':
				const sdResult = calculateStandardDeviation(numbers);
				result = sdResult.sd;
				explanation = `Mean: ${sdResult.mean}<br>Variance: ${sdResult.variance}`;
				break;
		}
		
		resultDiv.innerHTML = `
			<div class="success">
				<h3>Result: <span class="result-value">${result}</span></h3>
				<p class="result-details">${explanation}</p>
				<p class="data-set">Data: [${numbers.join(', ')}]</p>
			</div>
		`;
		
		// Store in lastResult
		if (typeof result === 'number') {
			lastResult = result;
		}
		
	} catch (error) {
		resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
	}
}

function calculateMean(numbers) {
	const sum = numbers.reduce((a, b) => a + b, 0);
	return Math.round((sum / numbers.length) * 1e10) / 1e10;
}

function calculateMedian(numbers) {
	const sorted = [...numbers].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	
	if (sorted.length % 2 === 0) {
		return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 1e10) / 1e10;
	} else {
		return sorted[mid];
	}
}

function calculateMode(numbers) {
	const frequency = {};
	let maxFreq = 0;
	
	numbers.forEach(num => {
		frequency[num] = (frequency[num] || 0) + 1;
		if (frequency[num] > maxFreq) {
			maxFreq = frequency[num];
		}
	});
	
	const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq);
	
	if (modes.length === numbers.length) {
		return {
			mode: 'No mode',
			explanation: 'All numbers appear with equal frequency'
		};
	}
	
	const modeValues = modes.map(m => parseFloat(m)).join(', ');
	return {
		mode: modeValues,
		explanation: `Appears ${maxFreq} time${maxFreq > 1 ? 's' : ''}`
	};
}

function calculateStandardDeviation(numbers) {
	const mean = calculateMean(numbers);
	const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
	const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
	const sd = Math.sqrt(variance);
	
	return {
		mean: Math.round(mean * 1e10) / 1e10,
		variance: Math.round(variance * 1e10) / 1e10,
		sd: Math.round(sd * 1e10) / 1e10
	};
}

// Equation Solver Functions
function openEquationSolver(type) {
	currentEquationType = type;
	closeAdvancedMenu();
	
	const equationInputs = document.getElementById('equationInputs');
	const equationTitle = document.getElementById('equationTitle');
	
	let html = '';
	
	switch(type) {
		case 'linear2':
			equationTitle.textContent = 'Linear Equation Solver (2 Variables)';
			html = `
				<p class="modal-description">Solve system: ax + by = c, dx + ey = f</p>
				<div class="equation-group">
					<h4>Equation 1: ax + by = c</h4>
					<div class="input-row">
						<input type="number" id="a1" placeholder="a" step="any">
						<span>x +</span>
						<input type="number" id="b1" placeholder="b" step="any">
						<span>y =</span>
						<input type="number" id="c1" placeholder="c" step="any">
					</div>
				</div>
				<div class="equation-group">
					<h4>Equation 2: dx + ey = f</h4>
					<div class="input-row">
						<input type="number" id="a2" placeholder="d" step="any">
						<span>x +</span>
						<input type="number" id="b2" placeholder="e" step="any">
						<span>y =</span>
						<input type="number" id="c2" placeholder="f" step="any">
					</div>
				</div>
			`;
			break;
			
		case 'linear3':
			equationTitle.textContent = 'Linear Equation Solver (3 Variables)';
			html = `
				<p class="modal-description">Solve system: ax + by + cz = d</p>
				<div class="equation-group">
					<h4>Equation 1</h4>
					<div class="input-row">
						<input type="number" id="a1" placeholder="a" step="any">x +
						<input type="number" id="b1" placeholder="b" step="any">y +
						<input type="number" id="c1" placeholder="c" step="any">z =
						<input type="number" id="d1" placeholder="d" step="any">
					</div>
				</div>
				<div class="equation-group">
					<h4>Equation 2</h4>
					<div class="input-row">
						<input type="number" id="a2" placeholder="e" step="any">x +
						<input type="number" id="b2" placeholder="f" step="any">y +
						<input type="number" id="c2" placeholder="g" step="any">z =
						<input type="number" id="d2" placeholder="h" step="any">
					</div>
				</div>
				<div class="equation-group">
					<h4>Equation 3</h4>
					<div class="input-row">
						<input type="number" id="a3" placeholder="i" step="any">x +
						<input type="number" id="b3" placeholder="j" step="any">y +
						<input type="number" id="c3" placeholder="k" step="any">z =
						<input type="number" id="d3" placeholder="l" step="any">
					</div>
				</div>
			`;
			break;
			
		case 'quadratic':
			equationTitle.textContent = 'Quadratic Equation Solver';
			html = `
				<p class="modal-description">Solve: ax² + bx + c = 0</p>
				<div class="equation-group">
					<div class="input-row">
						<input type="number" id="qa" placeholder="a" step="any">
						<span>x² +</span>
						<input type="number" id="qb" placeholder="b" step="any">
						<span>x +</span>
						<input type="number" id="qc" placeholder="c" step="any">
						<span>= 0</span>
					</div>
				</div>
			`;
			break;
	}
	
	equationInputs.innerHTML = html;
	document.getElementById('equationResult').innerHTML = '';
	document.getElementById('equationModal').style.display = 'flex';
}

function closeEquationModal() {
	document.getElementById('equationModal').style.display = 'none';
}

function solveEquation() {
	const resultDiv = document.getElementById('equationResult');
	
	try {
		let result;
		
		switch(currentEquationType) {
			case 'linear2':
				result = solveLinear2Variables();
				break;
			case 'linear3':
				result = solveLinear3Variables();
				break;
			case 'quadratic':
				result = solveQuadratic();
				break;
		}
		
		resultDiv.innerHTML = result;
		
	} catch (error) {
		resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
	}
}

function solveLinear2Variables() {
	const a1 = parseFloat(document.getElementById('a1').value);
	const b1 = parseFloat(document.getElementById('b1').value);
	const c1 = parseFloat(document.getElementById('c1').value);
	const a2 = parseFloat(document.getElementById('a2').value);
	const b2 = parseFloat(document.getElementById('b2').value);
	const c2 = parseFloat(document.getElementById('c2').value);
	
	if ([a1, b1, c1, a2, b2, c2].some(isNaN)) {
		throw new Error('Please fill all fields with valid numbers');
	}
	
	// Using Cramer's rule
	const det = a1 * b2 - a2 * b1;
	
	if (det === 0) {
		return '<p class="error">No unique solution exists (determinant = 0)</p>';
	}
	
	const x = (c1 * b2 - c2 * b1) / det;
	const y = (a1 * c2 - a2 * c1) / det;
	
	return `
		<div class="success">
			<h3>Solution:</h3>
			<p class="result-value">x = ${Math.round(x * 1e10) / 1e10}</p>
			<p class="result-value">y = ${Math.round(y * 1e10) / 1e10}</p>
			<p class="result-details">Determinant: ${det}</p>
		</div>
	`;
}

function solveLinear3Variables() {
	const a1 = parseFloat(document.getElementById('a1').value);
	const b1 = parseFloat(document.getElementById('b1').value);
	const c1 = parseFloat(document.getElementById('c1').value);
	const d1 = parseFloat(document.getElementById('d1').value);
	
	const a2 = parseFloat(document.getElementById('a2').value);
	const b2 = parseFloat(document.getElementById('b2').value);
	const c2 = parseFloat(document.getElementById('c2').value);
	const d2 = parseFloat(document.getElementById('d2').value);
	
	const a3 = parseFloat(document.getElementById('a3').value);
	const b3 = parseFloat(document.getElementById('b3').value);
	const c3 = parseFloat(document.getElementById('c3').value);
	const d3 = parseFloat(document.getElementById('d3').value);
	
	if ([a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3].some(isNaN)) {
		throw new Error('Please fill all fields with valid numbers');
	}
	
	// Calculate determinant using Sarrus' rule
	const det = a1 * (b2 * c3 - b3 * c2) - b1 * (a2 * c3 - a3 * c2) + c1 * (a2 * b3 - a3 * b2);
	
	if (det === 0) {
		return '<p class="error">No unique solution exists (determinant = 0)</p>';
	}
	
	// Using Cramer's rule for 3 variables
	const detX = d1 * (b2 * c3 - b3 * c2) - b1 * (d2 * c3 - d3 * c2) + c1 * (d2 * b3 - d3 * b2);
	const detY = a1 * (d2 * c3 - d3 * c2) - d1 * (a2 * c3 - a3 * c2) + c1 * (a2 * d3 - a3 * d2);
	const detZ = a1 * (b2 * d3 - b3 * d2) - b1 * (a2 * d3 - a3 * d2) + d1 * (a2 * b3 - a3 * b2);
	
	const x = detX / det;
	const y = detY / det;
	const z = detZ / det;
	
	return `
		<div class="success">
			<h3>Solution:</h3>
			<p class="result-value">x = ${Math.round(x * 1e10) / 1e10}</p>
			<p class="result-value">y = ${Math.round(y * 1e10) / 1e10}</p>
			<p class="result-value">z = ${Math.round(z * 1e10) / 1e10}</p>
			<p class="result-details">Determinant: ${Math.round(det * 1e10) / 1e10}</p>
		</div>
	`;
}

function solveQuadratic() {
	const a = parseFloat(document.getElementById('qa').value);
	const b = parseFloat(document.getElementById('qb').value);
	const c = parseFloat(document.getElementById('qc').value);
	
	if ([a, b, c].some(isNaN)) {
		throw new Error('Please fill all fields with valid numbers');
	}
	
	if (a === 0) {
		throw new Error('Coefficient a cannot be zero for a quadratic equation');
	}
	
	const discriminant = b * b - 4 * a * c;
	
	let resultHTML = `
		<div class="success">
			<h3>Solution:</h3>
			<p class="result-details">Discriminant (Δ) = b² - 4ac = ${Math.round(discriminant * 1e10) / 1e10}</p>
	`;
	
	if (discriminant > 0) {
		const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
		const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
		resultHTML += `
			<p class="result-value">x₁ = ${Math.round(x1 * 1e10) / 1e10}</p>
			<p class="result-value">x₂ = ${Math.round(x2 * 1e10) / 1e10}</p>
			<p class="result-details">Two real and distinct roots</p>
		`;
	} else if (discriminant === 0) {
		const x = -b / (2 * a);
		resultHTML += `
			<p class="result-value">x = ${Math.round(x * 1e10) / 1e10}</p>
			<p class="result-details">One real root (repeated)</p>
		`;
	} else {
		const realPart = -b / (2 * a);
		const imagPart = Math.sqrt(-discriminant) / (2 * a);
		resultHTML += `
			<p class="result-value">x₁ = ${Math.round(realPart * 1e10) / 1e10} + ${Math.round(imagPart * 1e10) / 1e10}i</p>
			<p class="result-value">x₂ = ${Math.round(realPart * 1e10) / 1e10} - ${Math.round(imagPart * 1e10) / 1e10}i</p>
			<p class="result-details">Two complex conjugate roots</p>
		`;
	}
	
	resultHTML += '</div>';
	return resultHTML;
}

// Close modals when clicking outside
window.onclick = function(event) {
	const advancedModal = document.getElementById('advancedModal');
	const statsModal = document.getElementById('statsModal');
	const equationModal = document.getElementById('equationModal');
	const themeModal = document.getElementById('themeModal');
	const numberModal = document.getElementById('numberModal');
	const unitModal = document.getElementById('unitModal');
	const graphModal = document.getElementById('graphModal');
	const matrixModal = document.getElementById('matrixModal');
	
	if (event.target === advancedModal) {
		closeAdvancedMenu();
	}
	if (event.target === statsModal) {
		closeStatsModal();
	}
	if (event.target === equationModal) {
		closeEquationModal();
	}
	if (event.target === themeModal) {
		closeThemeSwitcher();
	}
	if (event.target === numberModal || event.target === unitModal) {
		closeConverter();
	}
	if (event.target === graphModal) {
		closeGraphing();
	}
	if (event.target === matrixModal) {
		closeMatrix();
	}
}

/* ================================
   THEME SWITCHER
   ================================ */

function openThemeSwitcher() {
	document.getElementById('themeModal').style.display = 'flex';
	updateThemeSelection();
}

function closeThemeSwitcher() {
	document.getElementById('themeModal').style.display = 'none';
}

function setTheme(theme) {
	document.body.setAttribute('data-theme', theme);
	localStorage.setItem('calculatorTheme', theme);
	updateThemeSelection();
	showNotification(`Theme changed to ${theme}`, 'success');
}

function updateThemeSelection() {
	const currentTheme = localStorage.getItem('calculatorTheme') || 'dark';
	document.querySelectorAll('.theme-option').forEach(option => {
		option.classList.remove('active');
		if (option.getAttribute('data-theme') === currentTheme) {
			option.classList.add('active');
		}
	});
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
	const savedTheme = localStorage.getItem('calculatorTheme') || 'dark';
	document.body.setAttribute('data-theme', savedTheme);
});

/* ================================
   ENHANCED HISTORY PANEL
   ================================ */

function toggleHistoryPanel() {
	const sidebar = document.getElementById('historySidebar');
	sidebar.classList.toggle('open');
	if (sidebar.classList.contains('open')) {
		displayHistoryList();
	}
}

function displayHistoryList() {
	const historyList = document.getElementById('historyList');
	
	if (history.length === 0) {
		historyList.innerHTML = '<p class="no-history">No calculations yet</p>';
		return;
	}
	
	let html = '';
	// Show most recent first
	for (let i = history.length - 1; i >= 0; i--) {
		html += `
			<div class="history-item" onclick="useHistoryItem(${i})">
				<div class="expression">${history[i].expression}</div>
				<div class="result">= ${history[i].result}</div>
			</div>
		`;
	}
	
	historyList.innerHTML = html;
}

function useHistoryItem(index) {
	const item = history[index];
	document.getElementById('display').value = item.expression;
	showNotification('Expression loaded from history', 'success');
}

function filterHistory() {
	const searchTerm = document.getElementById('historySearch').value.toLowerCase();
	const items = document.querySelectorAll('.history-item');
	
	items.forEach(item => {
		const text = item.textContent.toLowerCase();
		if (text.includes(searchTerm)) {
			item.style.display = 'block';
		} else {
			item.style.display = 'none';
		}
	});
}

/* ================================
   NUMBER SYSTEM CONVERTER
   ================================ */

let currentConverterType = '';

function openConverter(type) {
	currentConverterType = type;
	closeAdvancedMenu();
	
	if (type === 'number') {
		document.getElementById('numberModal').style.display = 'flex';
		document.getElementById('numberResults').innerHTML = '';
	} else if (type === 'unit') {
		document.getElementById('unitModal').style.display = 'flex';
		updateUnitOptions();
		document.getElementById('unitResult').innerHTML = '';
	} else if (type === 'currency') {
		document.getElementById('currencyModal').style.display = 'flex';
		document.getElementById('currencyResult').innerHTML = '';
	} else if (type === 'time') {
		document.getElementById('timeModal').style.display = 'flex';
		document.getElementById('timeResult').innerHTML = '';
	} else if (type === 'data') {
		document.getElementById('dataModal').style.display = 'flex';
		document.getElementById('dataResult').innerHTML = '';
	}
}

function closeConverter() {
	document.getElementById('numberModal').style.display = 'none';
	document.getElementById('unitModal').style.display = 'none';
}

function convertNumber() {
	const input = document.getElementById('numberInput').value.trim();
	const base = parseInt(document.getElementById('numberBase').value);
	const resultsDiv = document.getElementById('numberResults');
	
	if (!input) {
		resultsDiv.innerHTML = '<p style="color: #ef4444;">Please enter a number</p>';
		return;
	}
	
	try {
		// Parse the input number based on selected base
		let decimal;
		if (base === 10) {
			decimal = parseInt(input, 10);
		} else if (base === 2) {
			decimal = parseInt(input, 2);
		} else if (base === 8) {
			decimal = parseInt(input, 8);
		} else if (base === 16) {
			decimal = parseInt(input, 16);
		}
		
		if (isNaN(decimal)) {
			throw new Error('Invalid number format');
		}
		
		// Convert to all bases
		const binary = decimal.toString(2);
		const octal = decimal.toString(8);
		const decimalStr = decimal.toString(10);
		const hexadecimal = decimal.toString(16).toUpperCase();
		
		resultsDiv.innerHTML = `
			<div class="result-item">
				<span class="label">Binary (Base 2):</span>
				<span class="value">${binary}</span>
			</div>
			<div class="result-item">
				<span class="label">Octal (Base 8):</span>
				<span class="value">${octal}</span>
			</div>
			<div class="result-item">
				<span class="label">Decimal (Base 10):</span>
				<span class="value">${decimalStr}</span>
			</div>
			<div class="result-item">
				<span class="label">Hexadecimal (Base 16):</span>
				<span class="value">${hexadecimal}</span>
			</div>
		`;
		
	} catch (error) {
		resultsDiv.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
	}
}

/* ================================
   UNIT CONVERTER
   ================================ */

const unitConversions = {
	length: {
		units: ['Meters', 'Kilometers', 'Centimeters', 'Millimeters', 'Miles', 'Yards', 'Feet', 'Inches'],
		toBase: {
			'Meters': 1,
			'Kilometers': 1000,
			'Centimeters': 0.01,
			'Millimeters': 0.001,
			'Miles': 1609.34,
			'Yards': 0.9144,
			'Feet': 0.3048,
			'Inches': 0.0254
		}
	},
	weight: {
		units: ['Kilograms', 'Grams', 'Milligrams', 'Pounds', 'Ounces', 'Tons'],
		toBase: {
			'Kilograms': 1,
			'Grams': 0.001,
			'Milligrams': 0.000001,
			'Pounds': 0.453592,
			'Ounces': 0.0283495,
			'Tons': 1000
		}
	},
	temperature: {
		units: ['Celsius', 'Fahrenheit', 'Kelvin'],
		special: true
	},
	area: {
		units: ['Square Meters', 'Square Kilometers', 'Square Feet', 'Square Miles', 'Acres', 'Hectares'],
		toBase: {
			'Square Meters': 1,
			'Square Kilometers': 1000000,
			'Square Feet': 0.092903,
			'Square Miles': 2589988.11,
			'Acres': 4046.86,
			'Hectares': 10000
		}
	},
	volume: {
		units: ['Liters', 'Milliliters', 'Cubic Meters', 'Gallons', 'Quarts', 'Pints', 'Cups'],
		toBase: {
			'Liters': 1,
			'Milliliters': 0.001,
			'Cubic Meters': 1000,
			'Gallons': 3.78541,
			'Quarts': 0.946353,
			'Pints': 0.473176,
			'Cups': 0.236588
		}
	},
	speed: {
		units: ['Meters/Second', 'Kilometers/Hour', 'Miles/Hour', 'Feet/Second', 'Knots'],
		toBase: {
			'Meters/Second': 1,
			'Kilometers/Hour': 0.277778,
			'Miles/Hour': 0.44704,
			'Feet/Second': 0.3048,
			'Knots': 0.514444
		}
	}
};

function updateUnitOptions() {
	const category = document.getElementById('unitCategory').value;
	const fromSelect = document.getElementById('unitFrom');
	const toSelect = document.getElementById('unitTo');
	
	const units = unitConversions[category].units;
	
	fromSelect.innerHTML = '';
	toSelect.innerHTML = '';
	
	units.forEach(unit => {
		fromSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
		toSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
	});
	
	if (units.length > 1) {
		toSelect.selectedIndex = 1;
	}
}

function convertUnit() {
	const category = document.getElementById('unitCategory').value;
	const value = parseFloat(document.getElementById('unitValue').value);
	const fromUnit = document.getElementById('unitFrom').value;
	const toUnit = document.getElementById('unitTo').value;
	const resultDiv = document.getElementById('unitResult');
	
	if (isNaN(value)) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid number</p>';
		return;
	}
	
	try {
		let result;
		
		if (category === 'temperature') {
			result = convertTemperature(value, fromUnit, toUnit);
		} else {
			const conversionData = unitConversions[category];
			const baseValue = value * conversionData.toBase[fromUnit];
			result = baseValue / conversionData.toBase[toUnit];
		}
		
		resultDiv.innerHTML = `
			<div class="result-item">
				<span class="label">${value} ${fromUnit}</span>
				<span class="value">${result.toFixed(6)} ${toUnit}</span>
			</div>
		`;
		
	} catch (error) {
		resultDiv.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
	}
}

function convertTemperature(value, from, to) {
	let celsius;
	
	// Convert to Celsius first
	if (from === 'Celsius') {
		celsius = value;
	} else if (from === 'Fahrenheit') {
		celsius = (value - 32) * 5 / 9;
	} else if (from === 'Kelvin') {
		celsius = value - 273.15;
	}
	
	// Convert from Celsius to target
	if (to === 'Celsius') {
		return celsius;
	} else if (to === 'Fahrenheit') {
		return celsius * 9 / 5 + 32;
	} else if (to === 'Kelvin') {
		return celsius + 273.15;
	}
}

/* ================================
   GRAPHING CALCULATOR
   ================================ */

function openGraphing() {
	closeAdvancedMenu();
	document.getElementById('graphModal').style.display = 'flex';
	document.getElementById('functionInput').value = '';
	document.getElementById('graphInfo').innerHTML = '';
	// Clear canvas
	const canvas = document.getElementById('graphCanvas');
	const ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function closeGraphing() {
	document.getElementById('graphModal').style.display = 'none';
}

function plotGraph() {
	const functionInput = document.getElementById('functionInput').value.trim();
	const canvas = document.getElementById('graphCanvas');
	const ctx = canvas.getContext('2d');
	const infoDiv = document.getElementById('graphInfo');
	
	if (!functionInput) {
		infoDiv.innerHTML = '<p style="color: #ef4444;">Please enter a function</p>';
		return;
	}
	
	try {
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Set up coordinate system
		const width = canvas.width;
		const height = canvas.height;
		const centerX = width / 2;
		const centerY = height / 2;
		const scale = 40; // pixels per unit
		
		// Draw grid
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 1;
		
		// Vertical lines
		for (let x = 0; x < width; x += scale) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		
		// Horizontal lines
		for (let y = 0; y < height; y += scale) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}
		
		// Draw axes
		ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
		ctx.lineWidth = 2;
		
		// X-axis
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.stroke();
		
		// Y-axis
		ctx.beginPath();
		ctx.moveTo(centerX, 0);
		ctx.lineTo(centerX, height);
		ctx.stroke();
		
		// Add axis labels
		ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		ctx.font = '12px Arial';
		ctx.fillText('0', centerX + 5, centerY + 15);
		
		// Prepare function for evaluation - handle more cases
		let funcString = functionInput
			.toLowerCase()
			.replace(/\^/g, '**')
			.replace(/π/g, 'Math.PI')
			.replace(/pi/g, 'Math.PI')
			.replace(/e(?![a-z])/gi, 'Math.E')
			.replace(/×/g, '*')
			.replace(/÷/g, '/')
			// Handle implicit multiplication: 2x -> 2*x
			.replace(/(\d+)([a-z])/g, '$1*$2')
			// Handle parentheses multiplication: 2(x) -> 2*(x)
			.replace(/(\d+)\(/g, '$1*(');
		
		// Replace function names with Math equivalents
		const mathFunctions = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp', 'asin', 'acos', 'atan', 'ceil', 'floor', 'round'];
		mathFunctions.forEach(func => {
			const regex = new RegExp(`\\b${func}\\b`, 'g');
			funcString = funcString.replace(regex, `Math.${func}`);
		});
		
		// Handle ln as natural log
		funcString = funcString.replace(/\bln\b/g, 'Math.log');
		
		// Plot function
		ctx.strokeStyle = '#f59e0b';
		ctx.lineWidth = 3;
		ctx.beginPath();
		
		let firstPoint = true;
		let pointCount = 0;
		let lastY = null;
		
		for (let px = 0; px < width; px++) {
			const x = (px - centerX) / scale;
			
			try {
				// Create safer eval using Function constructor
				const evalFunc = new Function('x', `return ${funcString.replace(/x/g, 'x')}`);
				const y = evalFunc(x);
				
				if (isFinite(y) && !isNaN(y)) {
					const py = centerY - y * scale;
					
					// Check for discontinuities
					if (lastY !== null && Math.abs(py - lastY) > height / 2) {
						firstPoint = true;
					}
					
					if (py >= -100 && py <= height + 100) { // Allow some overflow
						if (firstPoint) {
							ctx.moveTo(px, py);
							firstPoint = false;
						} else {
							ctx.lineTo(px, py);
						}
						pointCount++;
						lastY = py;
					} else {
						firstPoint = true;
						lastY = null;
					}
				} else {
					firstPoint = true;
					lastY = null;
				}
			} catch (e) {
				firstPoint = true;
				lastY = null;
			}
		}
		
		ctx.stroke();
		
		if (pointCount === 0) {
			infoDiv.innerHTML = '<p style="color: #ef4444;">No valid points to plot. Check your function syntax.</p>';
		} else {
			const xMin = Math.floor(width/(2*scale));
			const xMax = Math.floor(width/(2*scale));
			const yMin = Math.floor(height/(2*scale));
			const yMax = Math.floor(height/(2*scale));
			
			infoDiv.innerHTML = `
				<p><strong>Function:</strong> y = ${functionInput}</p>
				<p><strong>Domain (x):</strong> -${xMin} to ${xMax}</p>
				<p><strong>Range (y):</strong> -${yMin} to ${yMax}</p>
				<p><strong>Points plotted:</strong> ${pointCount}</p>
				<p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">
					<strong>Tips:</strong> Use x as variable. Examples: x^2, sin(x), 2*x+3, sqrt(x), abs(x), log(x)
				</p>
			`;
			showNotification('Graph plotted successfully!', 'success');
		}
		
	} catch (error) {
		infoDiv.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}<br>Please check your function syntax.</p>`;
	}
}

/* ================================
   MATRIX CALCULATOR
   ================================ */

function openMatrix() {
	closeAdvancedMenu();
	document.getElementById('matrixModal').style.display = 'flex';
	generateMatrixInputs();
}

function closeMatrix() {
	document.getElementById('matrixModal').style.display = 'none';
}

function generateMatrixInputs() {
	const operation = document.getElementById('matrixOperation').value;
	const inputsDiv = document.getElementById('matrixInputs');
	
	// Preserve existing size selections if they exist
	const existingRows = document.getElementById('matrixRows');
	const existingCols = document.getElementById('matrixCols');
	const currentRows = existingRows ? existingRows.value : '3';
	const currentCols = existingCols ? existingCols.value : '3';
	
	let html = '';
	
	// Show size controls with dropdowns
	html += `
		<div class="matrix-size-controls">
			<div class="size-control">
				<label>Rows:</label>
				<select id="matrixRows" onchange="updateMatrixGrids()">
					<option value="2" ${currentRows === '2' ? 'selected' : ''}>2</option>
					<option value="3" ${currentRows === '3' ? 'selected' : ''}>3</option>
					<option value="4" ${currentRows === '4' ? 'selected' : ''}>4</option>
					<option value="5" ${currentRows === '5' ? 'selected' : ''}>5</option>
				</select>
			</div>
			<div class="size-control">
				<label>Columns:</label>
				<select id="matrixCols" onchange="updateMatrixGrids()">
					<option value="2" ${currentCols === '2' ? 'selected' : ''}>2</option>
					<option value="3" ${currentCols === '3' ? 'selected' : ''}>3</option>
					<option value="4" ${currentCols === '4' ? 'selected' : ''}>4</option>
					<option value="5" ${currentCols === '5' ? 'selected' : ''}>5</option>
				</select>
			</div>
		</div>
	`;
	
	inputsDiv.innerHTML = html;
	updateMatrixGrids();
}

function updateMatrixGrids() {
	const operation = document.getElementById('matrixOperation').value;
	const rowsSelect = document.getElementById('matrixRows');
	const colsSelect = document.getElementById('matrixCols');
	
	if (!rowsSelect || !colsSelect) {
		return;
	}
	
	const rows = parseInt(rowsSelect.value) || 3;
	const cols = parseInt(colsSelect.value) || 3;
	
	// Remove old matrix grids (but keep size controls)
	const existingGrids = document.querySelectorAll('.matrix-container');
	existingGrids.forEach(grid => grid.remove());
	
	const inputsDiv = document.getElementById('matrixInputs');
	
	// Create a temporary container for the new matrices
	const matrixHTML = [];
	
	// Operations that need two matrices
	if (['add', 'subtract', 'multiply'].includes(operation)) {
		matrixHTML.push(generateMatrixHTML('A', rows, cols));
		if (operation === 'multiply') {
			// For multiplication, matrix B columns should match requirements
			matrixHTML.push(generateMatrixHTML('B', cols, rows));
		} else {
			matrixHTML.push(generateMatrixHTML('B', rows, cols));
		}
	} else {
		// Operations that need only one matrix
		matrixHTML.push(generateMatrixHTML('A', rows, cols));
	}
	
	// Insert matrices after size controls
	inputsDiv.insertAdjacentHTML('beforeend', matrixHTML.join(''));
	
	document.getElementById('matrixResult').innerHTML = '';
}

function generateMatrixHTML(name, rows, cols) {
	let html = `
		<div class="matrix-container">
			<h4>Matrix ${name} (${rows}×${cols})</h4>
			<div class="matrix-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
	`;
	
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			html += `<input type="number" id="m${name}_${i}_${j}" placeholder="0" step="any" value="0">`;
		}
	}
	
	html += `
			</div>
		</div>
	`;
	
	return html;
}

function calculateMatrix() {
	const operation = document.getElementById('matrixOperation').value;
	const rows = parseInt(document.getElementById('matrixRows').value);
	const cols = parseInt(document.getElementById('matrixCols').value);
	const resultDiv = document.getElementById('matrixResult');
	
	try {
		let result;
		
		switch(operation) {
			case 'add':
				result = matrixAddSubtract(rows, cols, true);
				break;
			case 'subtract':
				result = matrixAddSubtract(rows, cols, false);
				break;
			case 'multiply':
				result = matrixMultiply(rows, cols);
				break;
			case 'determinant':
				if (rows !== cols) {
					throw new Error('Determinant only exists for square matrices');
				}
				result = matrixDeterminant(rows);
				break;
			case 'transpose':
				result = matrixTranspose(rows, cols);
				break;
			case 'inverse':
				if (rows !== cols) {
					throw new Error('Inverse only exists for square matrices');
				}
				result = matrixInverse(rows);
				break;
			case 'rank':
				result = matrixRank(rows, cols);
				break;
		}
		
		resultDiv.innerHTML = result;
		showNotification('Matrix calculation complete!', 'success');
		
	} catch (error) {
		resultDiv.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
	}
}

function getMatrix(name, rows, cols) {
	const matrix = [];
	for (let i = 0; i < rows; i++) {
		matrix[i] = [];
		for (let j = 0; j < cols; j++) {
			const elem = document.getElementById(`m${name}_${i}_${j}`);
			const value = elem ? parseFloat(elem.value) : 0;
			matrix[i][j] = isNaN(value) ? 0 : value;
		}
	}
	return matrix;
}

function matrixAddSubtract(rows, cols, isAdd) {
	const A = getMatrix('A', rows, cols);
	const B = getMatrix('B', rows, cols);
	const result = [];
	
	for (let i = 0; i < rows; i++) {
		result[i] = [];
		for (let j = 0; j < cols; j++) {
			result[i][j] = isAdd ? A[i][j] + B[i][j] : A[i][j] - B[i][j];
		}
	}
	
	return formatMatrixResult(result, isAdd ? 'A + B' : 'A - B');
}

function matrixMultiply(rowsA, colsA) {
	const A = getMatrix('A', rowsA, colsA);
	const B = getMatrix('B', colsA, rowsA); // B has colsA rows and rowsA cols
	const result = [];
	
	const rowsB = colsA;
	const colsB = rowsA;
	
	for (let i = 0; i < rowsA; i++) {
		result[i] = [];
		for (let j = 0; j < colsB; j++) {
			result[i][j] = 0;
			for (let k = 0; k < colsA; k++) {
				result[i][j] += A[i][k] * B[k][j];
			}
		}
	}
	
	return formatMatrixResult(result, 'A × B');
}

function matrixDeterminant(size) {
	const A = getMatrix('A', size, size);
	const det = calculateDeterminant(A);
	
	return `
		<div class="success">
			<h3>Determinant:</h3>
			<p class="result-value" style="font-size: 2rem; color: var(--amber-light);">det(A) = ${det.toFixed(6)}</p>
		</div>
	`;
}

// General determinant calculation using cofactor expansion
function calculateDeterminant(matrix) {
	const n = matrix.length;
	
	if (n === 1) {
		return matrix[0][0];
	}
	
	if (n === 2) {
		return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
	}
	
	let det = 0;
	
	for (let j = 0; j < n; j++) {
		// Get minor matrix
		const minor = getMinor(matrix, 0, j);
		const cofactor = Math.pow(-1, j) * matrix[0][j] * calculateDeterminant(minor);
		det += cofactor;
	}
	
	return det;
}

function getMinor(matrix, row, col) {
	const n = matrix.length;
	const minor = [];
	
	for (let i = 0; i < n; i++) {
		if (i === row) continue;
		const minorRow = [];
		for (let j = 0; j < n; j++) {
			if (j === col) continue;
			minorRow.push(matrix[i][j]);
		}
		minor.push(minorRow);
	}
	
	return minor;
}

function matrixTranspose(rows, cols) {
	const A = getMatrix('A', rows, cols);
	const result = [];
	
	for (let i = 0; i < cols; i++) {
		result[i] = [];
		for (let j = 0; j < rows; j++) {
			result[i][j] = A[j][i];
		}
	}
	
	return formatMatrixResult(result, 'A<sup>T</sup>');
}

function matrixInverse(size) {
	const A = getMatrix('A', size, size);
	const det = calculateDeterminant(A);
	
	if (Math.abs(det) < 1e-10) {
		throw new Error('Matrix is singular (determinant ≈ 0), inverse does not exist');
	}
	
	// Use Gauss-Jordan elimination for general case
	const augmented = [];
	for (let i = 0; i < size; i++) {
		augmented[i] = [...A[i]];
		for (let j = 0; j < size; j++) {
			augmented[i].push(i === j ? 1 : 0);
		}
	}
	
	// Forward elimination
	for (let i = 0; i < size; i++) {
		// Find pivot
		let maxRow = i;
		for (let k = i + 1; k < size; k++) {
			if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
				maxRow = k;
			}
		}
		
		// Swap rows
		[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
		
		// Make diagonal 1
		const pivot = augmented[i][i];
		for (let j = 0; j < 2 * size; j++) {
			augmented[i][j] /= pivot;
		}
		
		// Eliminate column
		for (let k = 0; k < size; k++) {
			if (k !== i) {
				const factor = augmented[k][i];
				for (let j = 0; j < 2 * size; j++) {
					augmented[k][j] -= factor * augmented[i][j];
				}
			}
		}
	}
	
	// Extract inverse from augmented matrix
	const result = [];
	for (let i = 0; i < size; i++) {
		result[i] = augmented[i].slice(size);
	}
	
	return formatMatrixResult(result, 'A<sup>-1</sup>');
}

// Calculate matrix rank using row echelon form
function matrixRank(rows, cols) {
	const A = getMatrix('A', rows, cols);
	const matrix = A.map(row => [...row]); // Copy matrix
	
	let rank = 0;
	const minDim = Math.min(rows, cols);
	
	for (let col = 0; col < minDim; col++) {
		// Find pivot
		let pivotRow = -1;
		for (let row = rank; row < rows; row++) {
			if (Math.abs(matrix[row][col]) > 1e-10) {
				pivotRow = row;
				break;
			}
		}
		
		if (pivotRow === -1) continue;
		
		// Swap rows
		if (pivotRow !== rank) {
			[matrix[rank], matrix[pivotRow]] = [matrix[pivotRow], matrix[rank]];
		}
		
		// Eliminate below
		for (let row = rank + 1; row < rows; row++) {
			if (Math.abs(matrix[row][col]) > 1e-10) {
				const factor = matrix[row][col] / matrix[rank][col];
				for (let c = col; c < cols; c++) {
					matrix[row][c] -= factor * matrix[rank][c];
				}
			}
		}
		
		rank++;
	}
	
	return `
		<div class="success">
			<h3>Matrix Rank:</h3>
			<p class="result-value" style="font-size: 2rem; color: var(--amber-light);">rank(A) = ${rank}</p>
			<p class="result-details">The rank is the maximum number of linearly independent rows or columns.</p>
			<p class="result-details">Matrix dimensions: ${rows}×${cols}</p>
		</div>
	`;
}

function formatMatrixResult(matrix, title) {
	const rows = matrix.length;
	const cols = matrix[0].length;
	let html = `
		<div class="success">
			<h3>Result: ${title}</h3>
			<p class="result-details">Dimensions: ${rows}×${cols}</p>
			<div style="display: flex; justify-content: center; margin: 20px 0; overflow-x: auto;">
				<table style="border-collapse: collapse;">
	`;
	
	for (let i = 0; i < rows; i++) {
		html += '<tr>';
		for (let j = 0; j < cols; j++) {
			const value = matrix[i][j].toFixed(4);
			html += `<td style="padding: 10px 15px; text-align: center; color: var(--amber-light); font-family: Orbitron; font-size: 1.1rem; border: 1px solid var(--glass-border);">${value}</td>`;
		}
		html += '</tr>';
	}
	
	html += `
				</table>
			</div>
		</div>
	`;
	
	return html;
}

// ================================
// CURRENCY CONVERTER
// ================================

// Approximate exchange rates (relative to USD) - Updated Nov 2025
const exchangeRates = {
	USD: 1,        // US Dollar
	EUR: 0.92,     // Euro
	GBP: 0.79,     // British Pound Sterling
	INR: 83.12,    // Indian Rupee
	JPY: 149.50,   // Japanese Yen
	CNY: 7.24,     // Chinese Yuan
	AUD: 1.53,     // Australian Dollar
	CAD: 1.36,     // Canadian Dollar
	CHF: 0.88,     // Swiss Franc
	AED: 3.67,     // UAE Dirham
	SAR: 3.75,     // Saudi Riyal
	KRW: 1320,     // South Korean Won
	SGD: 1.34,     // Singapore Dollar
	HKD: 7.83,     // Hong Kong Dollar
	NZD: 1.67,     // New Zealand Dollar
	SEK: 10.58,    // Swedish Krona
	NOK: 10.82,    // Norwegian Krone
	DKK: 6.86,     // Danish Krone
	MXN: 17.15,    // Mexican Peso
	BRL: 4.98,     // Brazilian Real
	ZAR: 18.45,    // South African Rand
	RUB: 92.50,    // Russian Ruble
	TRY: 32.15,    // Turkish Lira
	PLN: 3.98,     // Polish Zloty
	THB: 35.20,    // Thai Baht
	IDR: 15680,    // Indonesian Rupiah
	MYR: 4.68,     // Malaysian Ringgit
	PHP: 56.25,    // Philippine Peso
	VND: 24350,    // Vietnamese Dong
	EGP: 30.90,    // Egyptian Pound
	NGN: 1555,     // Nigerian Naira
	PKR: 278.50,   // Pakistani Rupee
	BDT: 109.80,   // Bangladeshi Taka
	ILS: 3.72,     // Israeli Shekel
	QAR: 3.64,     // Qatari Riyal
	KWD: 0.31,     // Kuwaiti Dinar
	OMR: 0.38,     // Omani Rial
	BHD: 0.38,     // Bahraini Dinar
	CZK: 22.85,    // Czech Koruna
	HUF: 355,      // Hungarian Forint
	RON: 4.57,     // Romanian Leu
	ARS: 990,      // Argentine Peso
	CLP: 950,      // Chilean Peso
	COP: 4180,     // Colombian Peso
	PEN: 3.75,     // Peruvian Sol
	UAH: 41.20,    // Ukrainian Hryvnia
	KES: 129.50,   // Kenyan Shilling
	LKR: 308,      // Sri Lankan Rupee
	MMK: 2100,     // Myanmar Kyat
	NPR: 133,      // Nepalese Rupee
};

function closeCurrency() {
	document.getElementById('currencyModal').style.display = 'none';
}

function closeTime() {
	document.getElementById('timeModal').style.display = 'none';
}

function closeData() {
	document.getElementById('dataModal').style.display = 'none';
}

function convertCurrency() {
	const amount = parseFloat(document.getElementById('currencyAmount').value);
	const from = document.getElementById('currencyFrom').value;
	const to = document.getElementById('currencyTo').value;
	const resultDiv = document.getElementById('currencyResult');
	
	if (!amount || amount <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid amount</p>';
		return;
	}
	
	// Convert to USD first, then to target currency
	const amountInUSD = amount / exchangeRates[from];
	const result = amountInUSD * exchangeRates[to];
	
	const rate = exchangeRates[to] / exchangeRates[from];
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3>Converted Amount:</h3>
			<p class="result-value">${result.toFixed(2)} ${to}</p>
			<p class="result-details">${amount} ${from} = ${result.toFixed(2)} ${to}</p>
			<p class="result-details">Exchange Rate: 1 ${from} = ${rate.toFixed(4)} ${to}</p>
			<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 10px;">
				*Rates are approximate and for reference only
			</p>
		</div>
	`;
	showNotification('Currency converted successfully!', 'success');
}

// ================================
// TIME CONVERTER
// ================================

const timeConversions = {
	seconds: 1,
	minutes: 60,
	hours: 3600,
	days: 86400,
	weeks: 604800,
	months: 2592000, // Approximate (30 days)
	years: 31536000  // 365 days
};

function convertTime() {
	const amount = parseFloat(document.getElementById('timeAmount').value);
	const from = document.getElementById('timeFrom').value;
	const to = document.getElementById('timeTo').value;
	const resultDiv = document.getElementById('timeResult');
	
	if (!amount || amount < 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid value</p>';
		return;
	}
	
	const seconds = amount * timeConversions[from];
	const result = seconds / timeConversions[to];
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3>Converted Time:</h3>
			<p class="result-value">${result.toFixed(6)} ${to}</p>
			<p class="result-details">${amount} ${from} = ${result.toFixed(6)} ${to}</p>
		</div>
	`;
	showNotification('Time converted successfully!', 'success');
}

// ================================
// DATA STORAGE CONVERTER
// ================================

const dataConversions = {
	bit: 1,
	byte: 8,
	kb: 8192,        // 1024 bytes
	mb: 8388608,     // 1024 KB
	gb: 8589934592,  // 1024 MB
	tb: 8796093022208, // 1024 GB
	pb: 9007199254740992 // 1024 TB
};

function convertData() {
	const amount = parseFloat(document.getElementById('dataAmount').value);
	const from = document.getElementById('dataFrom').value;
	const to = document.getElementById('dataTo').value;
	const resultDiv = document.getElementById('dataResult');
	
	if (!amount || amount < 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid value</p>';
		return;
	}
	
	const bits = amount * dataConversions[from];
	const result = bits / dataConversions[to];
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3>Converted Data:</h3>
			<p class="result-value">${result.toFixed(6)} ${to.toUpperCase()}</p>
			<p class="result-details">${amount} ${from.toUpperCase()} = ${result.toFixed(6)} ${to.toUpperCase()}</p>
		</div>
	`;
	showNotification('Data converted successfully!', 'success');
}

// ================================
// CALCULATORS (Discount, GST, Finance, BMI, Date)
// ================================

function openCalculator(type) {
	closeAdvancedMenu();
	if (type === 'discount') {
		document.getElementById('discountModal').style.display = 'flex';
	} else if (type === 'gst') {
		document.getElementById('gstModal').style.display = 'flex';
	} else if (type === 'finance') {
		document.getElementById('financeModal').style.display = 'flex';
	} else if (type === 'bmi') {
		document.getElementById('bmiModal').style.display = 'flex';
	} else if (type === 'date') {
		document.getElementById('dateModal').style.display = 'flex';
		// Set default dates
		const today = new Date().toISOString().split('T')[0];
		document.getElementById('startDate').value = today;
		document.getElementById('endDate').value = today;
		updateDateCalcType();
	}
}

function closeDiscount() {
	document.getElementById('discountModal').style.display = 'none';
}

function closeGST() {
	document.getElementById('gstModal').style.display = 'none';
}

function closeFinance() {
	document.getElementById('financeModal').style.display = 'none';
}

function closeBMI() {
	document.getElementById('bmiModal').style.display = 'none';
}

function closeDate() {
	document.getElementById('dateModal').style.display = 'none';
}

// User Guide
function openGuide() {
	document.getElementById('guideModal').style.display = 'flex';
}

function closeGuide() {
	document.getElementById('guideModal').style.display = 'none';
}

// Discount Calculator
function calculateDiscount() {
	const originalPrice = parseFloat(document.getElementById('originalPrice').value);
	const discountPercent = parseFloat(document.getElementById('discountPercent').value);
	const resultDiv = document.getElementById('discountResult');
	
	if (!originalPrice || originalPrice <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid price</p>';
		return;
	}
	
	if (!discountPercent || discountPercent < 0 || discountPercent > 100) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid discount (0-100%)</p>';
		return;
	}
	
	const discountAmount = (originalPrice * discountPercent) / 100;
	const finalPrice = originalPrice - discountAmount;
	const savings = discountAmount;
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3>Discount Calculation:</h3>
			<p class="result-details">Original Price: ₹${originalPrice.toFixed(2)}</p>
			<p class="result-details">Discount: ${discountPercent}% (₹${discountAmount.toFixed(2)})</p>
			<p class="result-value" style="color: var(--amber-light);">Final Price: ₹${finalPrice.toFixed(2)}</p>
			<p class="result-details" style="color: #10b981;">You Save: ₹${savings.toFixed(2)}</p>
		</div>
	`;
	showNotification('Discount calculated!', 'success');
}

// GST Calculator
function calculateGST() {
	const gstType = document.getElementById('gstType').value;
	const amount = parseFloat(document.getElementById('gstAmount').value);
	const gstRate = parseFloat(document.getElementById('gstRate').value);
	const resultDiv = document.getElementById('gstResult');
	
	if (!amount || amount <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid amount</p>';
		return;
	}
	
	let gstAmount, totalAmount, baseAmount;
	
	if (gstType === 'add') {
		// Add GST to price
		baseAmount = amount;
		gstAmount = (amount * gstRate) / 100;
		totalAmount = amount + gstAmount;
		
		resultDiv.innerHTML = `
			<div class="success">
				<h3>GST Added (${gstRate}%):</h3>
				<p class="result-details">Base Amount: ₹${baseAmount.toFixed(2)}</p>
				<p class="result-details">GST Amount: ₹${gstAmount.toFixed(2)}</p>
				<p class="result-value" style="color: var(--amber-light);">Total (incl. GST): ₹${totalAmount.toFixed(2)}</p>
			</div>
		`;
	} else {
		// Remove GST from price
		totalAmount = amount;
		baseAmount = (amount * 100) / (100 + gstRate);
		gstAmount = amount - baseAmount;
		
		resultDiv.innerHTML = `
			<div class="success">
				<h3>GST Removed (${gstRate}%):</h3>
				<p class="result-details">Total Amount: ₹${totalAmount.toFixed(2)}</p>
				<p class="result-details">GST Amount: ₹${gstAmount.toFixed(2)}</p>
				<p class="result-value" style="color: var(--amber-light);">Base Amount: ₹${baseAmount.toFixed(2)}</p>
			</div>
		`;
	}
	showNotification('GST calculated!', 'success');
}

// EMI/Finance Calculator
function calculateEMI() {
	const principal = parseFloat(document.getElementById('loanAmount').value);
	const annualRate = parseFloat(document.getElementById('interestRate').value);
	const tenureMonths = parseInt(document.getElementById('loanTenure').value);
	const resultDiv = document.getElementById('financeResult');
	
	if (!principal || principal <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid loan amount</p>';
		return;
	}
	
	if (!annualRate || annualRate < 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid interest rate</p>';
		return;
	}
	
	if (!tenureMonths || tenureMonths <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid tenure</p>';
		return;
	}
	
	// Calculate EMI using formula: EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
	const monthlyRate = annualRate / (12 * 100);
	const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
	            (Math.pow(1 + monthlyRate, tenureMonths) - 1);
	
	const totalAmount = emi * tenureMonths;
	const totalInterest = totalAmount - principal;
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3>Loan EMI Calculation:</h3>
			<p class="result-value" style="color: var(--amber-light);">Monthly EMI: ₹${emi.toFixed(2)}</p>
			<p class="result-details">Principal Amount: ₹${principal.toFixed(2)}</p>
			<p class="result-details">Total Interest: ₹${totalInterest.toFixed(2)}</p>
			<p class="result-details">Total Amount: ₹${totalAmount.toFixed(2)}</p>
			<p class="result-details">Loan Tenure: ${tenureMonths} months (${(tenureMonths/12).toFixed(1)} years)</p>
		</div>
	`;
	showNotification('EMI calculated!', 'success');
}

// BMI Calculator
let selectedGender = 'female';

function selectGender(gender) {
	selectedGender = gender;
	document.getElementById('maleBtn').classList.remove('active');
	document.getElementById('femaleBtn').classList.remove('active');
	
	if (gender === 'male') {
		document.getElementById('maleBtn').classList.add('active');
	} else {
		document.getElementById('femaleBtn').classList.add('active');
	}
}

function calculateBMI() {
	const age = parseInt(document.getElementById('age').value);
	const weight = parseFloat(document.getElementById('weight').value);
	const heightCm = parseFloat(document.getElementById('height').value);
	const resultDiv = document.getElementById('bmiResult');
	
	if (!age || age <= 0 || age > 120) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid age (1-120)</p>';
		return;
	}
	
	if (!weight || weight <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid weight</p>';
		return;
	}
	
	if (!heightCm || heightCm <= 0) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid height</p>';
		return;
	}
	
	const heightM = heightCm / 100;
	const bmi = weight / (heightM * heightM);
	
	// Calculate ideal weight range for height (BMI 18.5 - 24.9)
	const minWeight = 18.5 * heightM * heightM;
	const maxWeight = 24.9 * heightM * heightM;
	
	let category, color, advice;
	if (bmi < 18.5) {
		category = 'Underweight';
		color = '#3b82f6';
		advice = 'Consider consulting a nutritionist for a healthy weight gain plan.';
	} else if (bmi < 25) {
		category = 'Normal';
		color = '#10b981';
		advice = 'Great! Maintain your healthy lifestyle.';
	} else if (bmi < 30) {
		category = 'Overweight';
		color = '#fbbf24';
		advice = 'Consider a balanced diet and regular exercise.';
	} else {
		category = 'Obese';
		color = '#f59e0b';
		advice = 'Consult a healthcare professional for personalized guidance.';
	}
	
	// Calculate marker position (scale from BMI 15 to 35)
	const minBMI = 15;
	const maxBMI = 35;
	const markerPosition = Math.min(Math.max(((bmi - minBMI) / (maxBMI - minBMI)) * 100, 0), 100);
	
	resultDiv.innerHTML = `
		<div class="success">
			<h3 style="text-align: center; margin-bottom: 1rem;">Your Current BMI</h3>
			<p class="bmi-result-large">${bmi.toFixed(1)}</p>
			<p style="text-align: center; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
				Body mass index
			</p>
			
			<div class="bmi-scale-container">
				<div class="bmi-scale">
					<div class="bmi-marker" style="left: ${markerPosition}%;">
						<div class="bmi-marker-value">${category}</div>
						<div class="bmi-marker-triangle"></div>
					</div>
				</div>
				<div class="bmi-scale-labels">
					<span><div class="label-value">18.5</div></span>
					<span><div class="label-value">24.0</div></span>
					<span><div class="label-value">28.0</div></span>
				</div>
				<div class="bmi-categories" style="margin-top: 1rem;">
					<div class="bmi-category-item">
						<div class="bmi-category-color" style="background: #3b82f6;"></div>
						<span class="bmi-category-text">Underweight</span>
					</div>
					<div class="bmi-category-item">
						<div class="bmi-category-color" style="background: #10b981;"></div>
						<span class="bmi-category-text">Normal</span>
					</div>
					<div class="bmi-category-item">
						<div class="bmi-category-color" style="background: #fbbf24;"></div>
						<span class="bmi-category-text">Overweight</span>
					</div>
					<div class="bmi-category-item">
						<div class="bmi-category-color" style="background: #f59e0b;"></div>
						<span class="bmi-category-text">Obese</span>
					</div>
				</div>
			</div>
			
			<div class="bmi-analysis">
				<h4>Analysis</h4>
				<div class="bmi-info-row">
					<span class="bmi-info-label">Height (cm)</span>
					<span class="bmi-info-value">${heightCm}</span>
				</div>
				<div class="bmi-info-row">
					<span class="bmi-info-label">Weight (kg)</span>
					<span class="bmi-info-value">${weight}</span>
				</div>
				<div class="bmi-info-row">
					<span class="bmi-info-label">Age</span>
					<span class="bmi-info-value">${age} years</span>
				</div>
				<div class="bmi-info-row">
					<span class="bmi-info-label">Gender</span>
					<span class="bmi-info-value">${selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)}</span>
				</div>
			</div>
			
			<div class="suggested-weight-range">
				<h4>Suggested weight (kg)</h4>
				<p>${minWeight.toFixed(1)} ~ ${maxWeight.toFixed(1)}</p>
			</div>
			
			<div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border-left: 4px solid ${color};">
				<p style="color: ${color}; font-weight: 600; margin-bottom: 0.5rem;">${advice}</p>
				<p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
					<strong>About BMI:</strong> Body mass index (BMI) is a person's weight in kilograms divided by the square of height in meters. BMI is an easy screening method for weight category.
				</p>
			</div>
		</div>
	`;
	showNotification('BMI calculated!', 'success');
}

// Date Calculator
function updateDateCalcType() {
	const type = document.getElementById('dateCalcType').value;
	const endDateGroup = document.getElementById('endDateGroup');
	const daysGroup = document.getElementById('daysGroup');
	
	if (type === 'difference') {
		endDateGroup.style.display = 'block';
		daysGroup.style.display = 'none';
	} else {
		endDateGroup.style.display = 'none';
		daysGroup.style.display = 'block';
	}
}

function calculateDate() {
	const type = document.getElementById('dateCalcType').value;
	const startDate = new Date(document.getElementById('startDate').value);
	const resultDiv = document.getElementById('dateResult');
	
	if (isNaN(startDate.getTime())) {
		resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid start date</p>';
		return;
	}
	
	if (type === 'difference') {
		const endDate = new Date(document.getElementById('endDate').value);
		
		if (isNaN(endDate.getTime())) {
			resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid end date</p>';
			return;
		}
		
		const diffTime = Math.abs(endDate - startDate);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const diffWeeks = Math.floor(diffDays / 7);
		const diffMonths = Math.floor(diffDays / 30.44);
		const diffYears = Math.floor(diffDays / 365.25);
		
		resultDiv.innerHTML = `
			<div class="success">
				<h3>Date Difference:</h3>
				<p class="result-value" style="color: var(--amber-light);">${diffDays} days</p>
				<p class="result-details">≈ ${diffWeeks} weeks</p>
				<p class="result-details">≈ ${diffMonths} months</p>
				<p class="result-details">≈ ${diffYears} years</p>
				<p class="result-details" style="margin-top: 10px;">
					From: ${startDate.toDateString()}<br>
					To: ${endDate.toDateString()}
				</p>
			</div>
		`;
	} else {
		const days = parseInt(document.getElementById('daysToAddSubtract').value);
		
		if (!days || isNaN(days)) {
			resultDiv.innerHTML = '<p style="color: #ef4444;">Please enter a valid number of days</p>';
			return;
		}
		
		const resultDate = new Date(startDate);
		
		if (type === 'add') {
			resultDate.setDate(resultDate.getDate() + days);
		} else {
			resultDate.setDate(resultDate.getDate() - days);
		}
		
		resultDiv.innerHTML = `
			<div class="success">
				<h3>Result Date:</h3>
				<p class="result-value" style="color: var(--amber-light);">${resultDate.toDateString()}</p>
				<p class="result-details">
					${type === 'add' ? 'Added' : 'Subtracted'} ${Math.abs(days)} days<br>
					${type === 'add' ? 'to' : 'from'} ${startDate.toDateString()}
				</p>
				<p class="result-details" style="margin-top: 10px;">
					Date: ${resultDate.toLocaleDateString()}<br>
					Day: ${resultDate.toLocaleDateString('en-US', { weekday: 'long' })}
				</p>
			</div>
		`;
	}
	showNotification('Date calculated!', 'success');
}
