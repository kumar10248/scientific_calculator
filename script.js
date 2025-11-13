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
		
		// Convert trigonometric functions based on angle mode
		if (angleMode === 'deg') {
			expression = expression.replace(/sin\(/g, 'sin(' + Math.PI / 180 + '*');
			expression = expression.replace(/cos\(/g, 'cos(' + Math.PI / 180 + '*');
			expression = expression.replace(/tan\(/g, 'tan(' + Math.PI / 180 + '*');
		}
		
		// Handle factorial
		expression = handleFactorial(expression);

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
		
		// Add success animation
		display.parentElement.classList.add('success-flash');
		setTimeout(() => {
			display.parentElement.classList.remove('success-flash');
		}, 300);
		
	} catch (error) {
		display.value = "Error";
		display.parentElement.classList.add('error-flash');
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
	return expr.replace(/(\d+)!/g, 'factorial($1)');
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

function animateDisplay() {
	let display = document.getElementById("display");
	display.style.transform = 'scale(0.98)';
	setTimeout(() => {
		display.style.transform = 'scale(1)';
	}, 100);
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
			memory = parseFloat(display.value) || lastResult || 0;
			saveMemory();
			showNotification('Memory Stored: ' + memory);
		} catch (e) {
			showNotification('Cannot store to memory');
		}
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
			let value = parseFloat(display.value) || lastResult || 0;
			memory += value;
			saveMemory();
			showNotification('Added to Memory: ' + memory);
		} catch (e) {
			showNotification('Cannot add to memory');
		}
	}
}

function memorySubtract() {
	let display = document.getElementById("display");
	if (display.value) {
		try {
			let value = parseFloat(display.value) || lastResult || 0;
			memory -= value;
			saveMemory();
			showNotification('Subtracted from Memory: ' + memory);
		} catch (e) {
			showNotification('Cannot subtract from memory');
		}
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
	showNotification('History Cleared');
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
		} catch (e) {
			display.value = "Error";
		}
	}
}

function square() {
	let display = document.getElementById("display");
	if (display.value) {
		display.value += "^(2)";
		animateDisplay();
	}
}

function cube() {
	let display = document.getElementById("display");
	if (display.value) {
		display.value += "^(3)";
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
