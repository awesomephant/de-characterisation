let c;
let ticking = false;
let mouseDown = false;

const config = {
    gridLines: {
        x: 20,
        y: 20
    },
    minPointDistance: 40,
    minGridLinePoints: {
        horizontal: 3,
        vertical: 3,
        right45: 3,
        left45: 3,
    }
}

let state = {
    userPoints: [[]],
    gridPoints: [],
    selectedIndexes: [],
    userGrid: {
        horizontal: [],
        vertical: [],
        right45: [],
        left45: [],
    },
    currentMode: 'drawing'
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

function strokeCircle(x, y, r) {
    c.strokeStyle = 'blue'
    c.lineWidth = '.8'
    c.beginPath();
    c.arc(x, y, r, 0, 2 * Math.PI, false);
    c.stroke();
}

function drawBaseGrid() {
    c.fillStyle = 'grey'
    for (let i = 0; i < state.gridPoints.length; i++) {
        let p = state.gridPoints[i];
        c.fillRect(p[0], p[1], 2, 2)
    }
}

function drawPath() {
    c.strokeStyle = 'black'
    c.lineWidth = '5'
    c.beginPath()
    c.moveTo(state.userPoints[0][0], state.userPoints[0][1]);
    for (let i = 1; i < state.userPoints.length; i++) {
        c.lineTo(state.userPoints[i][0], state.userPoints[i][1]);
    }
    c.stroke()
}

function handleMouseMove(pos) {
    if (mouseDown) {
        state.userPoints.push([pos.x, pos.y])
    }
}

function drawUserGrid() {
    for (let i = 0; i < state.selectedIndexes.length; i++) {
        let p = state.gridPoints[state.selectedIndexes[i]]
        strokeCircle(p[0], p[1], 8)
    }
    c.strokeStyle = 'seagreen';
    for (let i = 0; i < state.userGrid.vertical.length; i++) {
        c.beginPath()
        c.moveTo(state.userGrid.vertical[i],0)
        c.lineTo(state.userGrid.vertical[i], c.canvas.height)
        c.stroke()
    }
    for (let i = 0; i < state.userGrid.horizontal.length; i++) {
        c.beginPath()
        c.moveTo(0, state.userGrid.horizontal[i])
        c.lineTo(c.canvas.width, state.userGrid.horizontal[i])
        c.stroke()
    }
}

function setUserGrid() {
    // Let's get all the selected points into an array for convenience
    let points = []
    for (let i = 0; i < state.selectedIndexes.length; i++) {
        points.push(state.gridPoints[state.selectedIndexes[i]])
    }

    // Go through selected grid points and count how many are in line horizontally,
    // vertically and at 45 degree angles

    function findValue(arr, val) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].value === val) {
                return i;
            }
        }
        return false;
    }

    let xValues = []
    let yValues = []

    console.log(`Generating grid from ${points.length} points.`)
    for (let a = 0; a < points.length; a++) {
        let p = points[a];
        // Vertical Lines
        let xIndex = findValue(xValues, p[0])
        if (xIndex === false) {
            xValues.push({ value: p[0], count: 1 })
        } else {
            xValues[xIndex].count++;
        }
        // Horizontal Lines
        let yIndex = findValue(yValues, p[0])
        if (yIndex === false) {
            yValues.push({ value: p[0], count: 1 })
        } else {
            yValues[yIndex].count++;
        }
        // 45 Degree Lines
    }
    console.log(xValues);

    // Set final user grid lines if enough points are in line (determined by config value)
    for (let i = 0; i < xValues.length; i++) {
        if (xValues[i].count >= config.minGridLinePoints.vertical) {
            state.userGrid.horizontal.push(xValues[i].value)
        }
    }
    for (let i = 0; i < yValues.length; i++) {
        if (yValues[i].count >= config.minGridLinePoints.horizontal) {
            state.userGrid.vertical.push(yValues[i].value)
        }
    }
}

function findNearestGridPoints() {
    let indexes = [];
    for (let i = 0; i < state.userPoints.length; i++) {
        let up = state.userPoints[i]
        for (let j = 0; j < state.gridPoints.length; j++) {
            let gp = state.gridPoints[j]
            let d = distance(up, gp)
            if (d < config.minPointDistance && !indexes.includes(j)) {
                indexes.push(j)
            }
        }
    }
    return indexes;
}

function gameLoop() {
    window.requestAnimationFrame(gameLoop);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height)
    drawBaseGrid();
    drawPath();
    drawUserGrid();
};

window.addEventListener('DOMContentLoaded', function () {
    c = document.querySelector('#world').getContext('2d')
    c.canvas.setAttribute('width', window.innerWidth - 0)
    c.canvas.setAttribute('height', window.innerHeight - 0)

    for (let i = 0; i < config.gridLines.x; i++) {
        for (let j = 0; j < config.gridLines.y; j++) {
            let x = (c.canvas.width / config.gridLines.x) * i;
            let y = (c.canvas.height / config.gridLines.y) * j;
            state.gridPoints.push([x, y])
        }
    }

    c.canvas.addEventListener('mousemove', function (e) {
        last_known_mouse_position = { x: e.clientX, y: e.clientY };
        if (!ticking) {
            window.requestAnimationFrame(function () {
                handleMouseMove(last_known_mouse_position);
                ticking = false;
            });

            ticking = true;
        }
    });

    window.addEventListener('mousedown', function () {
        mouseDown = true;
        state.userPoints = [];
    })
    window.addEventListener('mouseup', function () {
        mouseDown = false;
        state.userGrid.horizontal = []
        state.userGrid.vertical = []
        state.userGrid.right45 = []
        state.userGrid.left45 = []
        state.selectedIndexes = findNearestGridPoints();
        setUserGrid();
    })

    gameLoop()
})