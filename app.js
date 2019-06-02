let c, c_permutations;
let ticking = false;
let mouseDown = false;

const config = {
    gridLines: {
        x: 20,
        y: 20
    },
    minPointDistance: 30,
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
    userGrid: [],
    userGridIntersections: [],
    userGridSegments: [],
    finalSegments: [],
    currentMode: 'drawing'
}

const gri = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

function getVectorAngle(p1, p2) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
}


// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }
    denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
    // Lines are parallel
    if (denominator === 0) {
        return false
    }
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator
    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return 'parallel intersect'
    }
    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)
    return { x, y }
}

function strokeCircle(x, y, r) {
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
    c.lineWidth = '4'
    c.beginPath()
    c.moveTo(state.userPoints[0][0], state.userPoints[0][1]);
    for (let i = 1; i < state.userPoints.length; i++) {
        c.lineTo(state.userPoints[i][0], state.userPoints[i][1]);
    }
    c.stroke()
}

function multiplyArray(arr, n) {
    let newArr = []
    for (let i = 0; i < arr.length; i++) {
        newArr.push(arr[i] * i)
    }
    return newArr;
}

function handleMouseMove(pos) {
    if (mouseDown) {
        state.userPoints.push([pos.x, pos.y])
    }
}

function drawUserGrid() {
    for (let i = 0; i < state.selectedIndexes.length; i++) {
        let p = state.gridPoints[state.selectedIndexes[i]]
        //strokeCircle(p[0], p[1], 8)
    }
    c.lineWidth = .8;
    for (let i = 0; i < state.finalSegments.length; i++) {
        c.strokeStyle = 'black';
        c.strokeWidth = .7;
        let id = i;
        c.fillStyle = 'black';
        c.font = '15px Helvetica';
        let seg = state.finalSegments[i];
        c.fillText(id, seg.x1 + 15, seg.y1 + 15)
        //let id = i;
        //c.fillStyle = seg.color;
        //c.strokeStyle = seg.color;
        c.font = '15px Helvetica';
        //c.fillText(id, points[0][0] + 20, points[0][1] + 20)
        c.fillRect(seg.x1, seg.y1, 4, 4);
        c.fillRect(seg.x2, seg.y2, 4, 4);
        c.beginPath()
        c.moveTo(seg.x1, seg.y1);
        c.lineTo(seg.x2, seg.y2);
        c.stroke()
    }
    for (let i = 0; i < state.userGridIntersections.length; i++) {
        let p = state.userGridIntersections[i]
        //        strokeCircle(p[0], p[1], 5)
    }
}

function makeUserGridSegments() {
    console.log(`Splitting ${state.userGrid.length} grid lines into segments..`)
    function intersectionExists(intersection) {
        for (let i = 0; i < state.userGridIntersections.length; i++) {
            let n = state.userGridIntersections[i];
            if (Math.floor(intersection.x) === Math.floor(n[0]) &&
                Math.floor(intersection.y) === Math.floor(n[1])) {
                return true;
            }
        }
        return false;
    };

    function intersectionIsOnGrid(intersection) {
        for (let i = 0; i < state.gridPoints.length; i++) {
            let gp = state.gridPoints[i];
            if (Math.round(gp[0]) === Math.round(intersection.x) &&
                Math.round(gp[1]) === Math.round(intersection.y)) {
                return true;
            }
        }
        return false;
    };

    function segmentExists(seg) {
        for (let i = 0; i < state.finalSegments.length; i++) {
            let _seg = state.finalSegments[i];
            if ((seg.x1 === _seg.x1 && seg.x2 === _seg.x2 && seg.y1 === _seg.y1 && seg.y2 === _seg.y2) ||
                (seg.x1 === _seg.x2 && seg.x2 === _seg.x1 && seg.y1 === _seg.y2 && seg.y2 === _seg.y1) ||
                (seg.x1 === _seg.x2 && seg.x2 === _seg.x1 && seg.y1 === _seg.y2 && seg.y2 === _seg.y1)
            ) {
                console.log('Duplicate segment found')
                return true;
            }
        }
        return false;
    }

    state.linesWithIntersections = []
    for (let i = 0; i < state.userGrid.length; i++) {
        let l1 = state.userGrid[i];
        let lineObject = { points: [l1[0]], id: i }
        for (let j = 0; j < state.userGrid.length; j++) {
            if (j != i) {
                let l2 = state.userGrid[j];
                let intersection = intersect(l1[0][0], l1[0][1], l1[1][0], l1[1][1], l2[0][0], l2[0][1], l2[1][0], l2[1][1])
                if (intersection != false &&
                    intersectionExists(intersection) === false
                    && intersectionIsOnGrid(intersection)
                ) {
                    state.userGridIntersections.push([intersection.x, intersection.y])
                    lineObject.points.push([intersection.x, intersection.y])
                }
            }
        }
        lineObject.points.push(l1[1])
        state.userGridSegments.push(lineObject)
    }

    state.finalSegments = [];
    for (let i = 0; i < state.userGridSegments.length; i++) {
        let points = state.userGridSegments[i].points;
        for (let j = 0; j < points.length - 1; j++) {
            let p1 = points[j];
            let p2 = points[j + 1];
            if (segmentExists({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }) === false) {
                state.finalSegments.push({ offset: gri(-5, 5), color: randomColor(), active: false, x1: Math.round(p1[0]), y1: Math.round(p1[1]), x2: Math.round(p2[0]), y2: Math.round(p2[1]) })
            }
        }
    }

    makePermutations();
    //    document.querySelector('#makePermutations').style.opacity = '1';
    //    document.querySelector('#makePermutations').style.bottom = '2.1rem';
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
    function lineExists(a, b) {
        for (let i = 0; i < state.userGrid.length; i++) {
            let n = state.userGrid[i];
            // checks if line segment points are identical (in both directions)
            if ((n[0][0] === a[0] && n[0][1] === a[1] && n[1][0] === b[0] && n[1][1] === b[1]) ||
                (n[0][0] === b[0] && n[0][1] === b[1] && n[1][0] === a[0] && n[1][1] === a[1])
            ) {
                return true;
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
        let yIndex = findValue(yValues, p[1])
        if (yIndex === false) {
            yValues.push({ value: p[1], count: 1 })
        } else {
            yValues[yIndex].count++;
        }
        // 45 Degree Lines
        let referenceAngle = Math.round(getVectorAngle(state.gridPoints[0], state.gridPoints[config.gridLines.x + 1]));
        let referenceDistance = 10;
        for (let b = 0; b < points.length; b++) {
            if (b != a) {
                let angle = Math.abs(Math.round(getVectorAngle(points[a], points[b])))
                if (angle === referenceAngle && lineExists(points[a], points[b]) === false) {
                    state.userGrid.push([points[a], points[b]])
                }
            }

        }
    }
    // Set final user grid lines if enough points are in line (determined by config value)
    for (let i = 0; i < xValues.length; i++) {
        if (xValues[i].count >= config.minGridLinePoints.vertical) {
            state.userGrid.push([[xValues[i].value, 0], [xValues[i].value, c.canvas.height]])
        }
    }
    for (let i = 0; i < yValues.length; i++) {
        if (yValues[i].count >= config.minGridLinePoints.horizontal) {
            state.userGrid.push([[0, yValues[i].value], [c.canvas.width, yValues[i].value]])
        }
    }

    makeUserGridSegments();
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

function heads() {
    if (Math.random() > .5) {
        return true
    }
    return false;
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

function makePermutations() {
    let cp = document.querySelector('#permutations').getContext('2d')
    cp.canvas.setAttribute('width', window.innerWidth - 0)
    cp.canvas.setAttribute('height', window.innerHeight * 2)
    cp.font = '30px Helvetica';
    let permutationCount = Math.pow(2, state.finalSegments.length) / 2;
    displayCount = permutationCount;
    const maxDisplayCount = 5000;
    let limitString = ''
    if (permutationCount > maxDisplayCount) {
        displayCount = maxDisplayCount;
        limitString = `, showing ${maxDisplayCount}.`
    }
    cp.fillText(`${state.finalSegments.length} segments, ${permutationCount} Permutations${limitString}`, 10, 50)
    let displayWidth = 0;
    if (permutationCount < 100) {
        displayWidth = 150;
    } else if (permutationCount < 1000) {
        displayWidth = 100;
    } else {
        displayWidth = 80;
    }
    let margin = 20;
    let scaleFactor = (displayWidth - margin) / cp.canvas.width;
    let displayHeight = window.innerHeight * scaleFactor;
    let x = 0;
    let y = 80;
    let colcount = 0;
    for (let i = 0; i < displayCount; i++) {
        x = displayWidth * colcount;
        if (x > cp.canvas.width) {
            x = 0;
            colcount = 0;
            y += displayHeight;
        }
        colcount++;
        cp.strokeStyle = 'lightgrey'
        cp.lineWidth = '.8'
        cp.strokeRect(x, y, displayWidth, displayHeight)
        cp.lineWidth = displayWidth * .07
        cp.strokeStyle = 'black'
        cp.lineCap = "flat";
        let permutationBinary = '0000000000000000000000000000000' + dec2bin(i);

        for (let a = 0; a < state.finalSegments.length; a++) {
            let seg = state.finalSegments[a];
            let onOrOff = permutationBinary.substr(-a, 1);
            let sScaled = {
                x1: seg.x1 * scaleFactor,
                y1: seg.y1 * scaleFactor,
                x2: seg.x2 * scaleFactor,
                y2: seg.y2 * scaleFactor
            }
            cp.beginPath()
            cp.moveTo(x + sScaled.x1, y + sScaled.y1)
            cp.lineTo(x + sScaled.x2, y + sScaled.y2)
            if (onOrOff === '1') {
                cp.stroke();
            }
        }
    }
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
    document.querySelector('#makePermutations').addEventListener('click', function () {
        makePermutations();
    })
    window.addEventListener('mouseup', function () {
        mouseDown = false;
        state.userGrid = []
        state.userGridIntersections = []
        state.userGridSegments = []
        state.selectedIndexes = findNearestGridPoints();
        setUserGrid();
    })

    gameLoop()
})