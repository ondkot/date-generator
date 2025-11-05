const P_CMPXG_ADD = 0.15;
const P_CMPXG_SUB = 0.15;
const P_CMPXG_DIV = 0.15;
const P_CMPXG_ROOT = 0.15;
const P_CMPXG_LOG = 0.15;
const P_CMPXG_EXP1 = 0.125;
const P_CMPXG_MUL1 = 0.125;

const P_CMPXG_SIMP = 0.4;

class EquationNode {
    static NUM_PARAMETERS;
    numParameters;
    parameters;

    constructor(numParameters, parameters) {
        this.numParameters = numParameters;
        if (parameters.length != numParameters) {
            throw new RangeError("parameters.length != numParameters");
        }
        this.parameters = parameters;
    }

    toString() {}

    complexify(depthRemaining = -1) {
        if (depthRemaining == -1) { depthRemaining = 3; }
        console.log(depthRemaining);
        let newParameters = [];
        for (let i = 0; i < this.parameters.length; i++) {
            newParameters.push(this.parameters[i].complexify(depthRemaining - 1))
        }
        if (depthRemaining > 0) {
            return new this.constructor(newParameters);
        } else {
            return new VariableEquationNode([new this.constructor(newParameters)]);
        }
    }
}

class ValueEquationNode extends EquationNode {
    static NUM_PARAMETERS = 1;
    static VALUE_INDEX = 0;

    constructor(parameters) {
        super(ValueEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mn>" + this.parameters[ValueEquationNode.VALUE_INDEX].toString() + "</mn>"; }

    #weightedRandom(probabilities) {
        let r = Math.random();
        let cumulativeSum = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeSum += probabilities[i]
            if (r < cumulativeSum) { return i; }
        }

        return 0;
    }

    complexify(depthRemaining) {
        //   x + 0, x - 0
        //   x * 1, x : 1
        //   x^1, 1rt x
        // (x - y) + y, (x + y) - y
        // (x * y) : y
        // y-rt x^y, log-y y^x
        let n = this.#weightedRandom([P_CMPXG_ADD, P_CMPXG_SUB, P_CMPXG_DIV, P_CMPXG_ROOT, P_CMPXG_LOG,
                                    P_CMPXG_EXP1, P_CMPXG_MUL1])
        let r;
        switch (n) {
            case 0:
                r = (Math.random() < P_CMPXG_SIMP) ? (Math.floor(Math.random() * this.parameters[0])) : 0
                return new AddEquationNode([new ValueEquationNode([this.parameters[0] - r]),
                                                new ValueEquationNode([r])]);
            case 1:
                r = (Math.random() < P_CMPXG_SIMP) ? (Math.floor(Math.random() * 1000)) : 0
                return new SubtractEquationNode([new ValueEquationNode([this.parameters[0] + r]),
                                                new ValueEquationNode([r])]);
            case 2:
                r = (Math.random() < P_CMPXG_SIMP) ? (Math.floor(Math.random() * 1000) + 1) : 1
                return new DivideEquationNode([new ValueEquationNode([this.parameters[0] * r]),
                                                new ValueEquationNode([r])]);
            case 3:
                r = (Math.random() < P_CMPXG_SIMP) ? (Math.floor(Math.random() * (10 / Math.max(Math.log10(this.parameters[0]), 1) - 1)) + 1) : 1
                return new RootEquationNode([new ValueEquationNode([Math.pow(this.parameters[0], r)]),
                                                new ValueEquationNode([r])]);
            case 4:
                r = Math.floor(Math.random() * (Math.pow(10, 10 / Math.max(this.parameters[0], 1)) - 2)) + 2
                if (Math.pow(r, this.parameters[0]) < 10000000000 && r > 1) {
                    return new LogEquationNode([new ValueEquationNode([Math.pow(r, this.parameters[0])]),
                                                new ValueEquationNode([r])]);
                }
            case 5:
                return new ExponentEquationNode([new ValueEquationNode([this.parameters[0]]),
                                                new ValueEquationNode([1])]);
            case 6:
                return new MultiplyEquationNode([new ValueEquationNode([this.parameters[0]]),
                                                new ValueEquationNode([1])]);
            default:
                return new ValueEquationNode([this.parameters[0]]);
        }
    }
}

class VariableEquationNode extends EquationNode {
    static NUM_PARAMETERS = 1;
    static VALUE_INDEX = 0;

    static variables = [];

    constructor(parameters) {
        super(VariableEquationNode.NUM_PARAMETERS, parameters);
    }

    static #indexToString(i) {
        return (i + 10).toString(36); // number to a - z
    }

    static #add(node) {
        this.variables.push(node);
        return this.#indexToString(this.variables.length - 1);
    }

    static variablesToString() {
        let string = "";
        for (let i = 0; i < this.variables.length; i++) {
            string += "<math><mi>" + this.#indexToString(i) + "</mi><mo>=</mo>" + this.variables[i] + "</math><br/>";
        }
        return string;
    }

    toString() { return "<mi>" + VariableEquationNode.#add(this.parameters[VariableEquationNode.VALUE_INDEX]) + "</mi>"; }
}

class AddEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static NODE1_INDEX = 0;
    static NODE2_INDEX = 1;

    constructor(parameters) {
        super(AddEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mrow>" + this.parameters[AddEquationNode.NODE1_INDEX] + "<mo>+</mo>" + this.parameters[AddEquationNode.NODE2_INDEX] + "</mrow>"; }
}

class SubtractEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static NODE1_INDEX = 0;
    static NODE2_INDEX = 1;

    constructor(parameters) {
        super(SubtractEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mrow>" + this.parameters[SubtractEquationNode.NODE1_INDEX] + "<mo>-</mo><mrow><mo>(</mo>" + this.parameters[SubtractEquationNode.NODE2_INDEX] + "<mo>)</mo></mrow></mrow>"; }
}

class MultiplyEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static NODE1_INDEX = 0;
    static NODE2_INDEX = 1;

    constructor(parameters) {
        super(MultiplyEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mrow><mrow><mo>(</mo>" + this.parameters[MultiplyEquationNode.NODE1_INDEX] + "<mo>)</mo></mrow><mo>*</mo><mrow><mo>(</mo>" + this.parameters[MultiplyEquationNode.NODE2_INDEX] + "<mo>)</mo></mrow></mrow>"; }
}

class DivideEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static NODE1_INDEX = 0;
    static NODE2_INDEX = 1;

    constructor(parameters) {
        super(DivideEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mrow><mrow><mo>(</mo>" + this.parameters[DivideEquationNode.NODE1_INDEX] + "<mo>)</mo></mrow><mo>:</mo><mrow><mo>(</mo>" + this.parameters[DivideEquationNode.NODE2_INDEX] + "<mo>)</mo></mrow></mrow>"; }
}

class ExponentEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static BASE_INDEX = 0;
    static POWER_INDEX = 1;

    constructor(parameters) {
        super(ExponentEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<msup><mrow><mo>(</mo>" + this.parameters[ExponentEquationNode.BASE_INDEX] + "<mo>)</mo></mrow>" + this.parameters[ExponentEquationNode.POWER_INDEX] + "</msup>"; }
}

class RootEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static BASE_INDEX = 0;
    static POWER_INDEX = 1;

    constructor(parameters) {
        super(RootEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mroot>" + this.parameters[RootEquationNode.BASE_INDEX] + this.parameters[RootEquationNode.POWER_INDEX] + "</mroot>"; }
}

class LogEquationNode extends EquationNode {
    static NUM_PARAMETERS = 2;
    static VALUE_INDEX = 0;
    static BASE_INDEX = 1;

    constructor(parameters) {
        super(LogEquationNode.NUM_PARAMETERS, parameters);
    }

    toString() { return "<mrow><msub><mo>log</mo>" + this.parameters[LogEquationNode.BASE_INDEX] + "</msub><mrow><mo>(</mo>" + this.parameters[LogEquationNode.VALUE_INDEX] + "<mo>)</mo></mrow></mrow>"; }
}

function generate(value, iterations) {
    let node = new ValueEquationNode([value]);
    for (let i = 0; i < iterations; i++) {
        let newNode = node.complexify();
        node = newNode;
    }
    return node;
}

function writeDate() {
    let date = new Date();
    document.write("<h1>Today is:</h1>")
    document.write("<math>" + generate(date.getDate(), 5).toString() +
                        "." + generate(date.getMonth() + 1, 5).toString() +
                        "." + generate(date.getFullYear(), 5).toString() + "</math><br/>")
    document.write(VariableEquationNode.variablesToString())
}
