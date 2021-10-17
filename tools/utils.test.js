const utils = require("./utils")
// @ponicode
describe("utils.removeEmpty", () => {
    test("0", () => {
        let param1 = [[50, 70, 90], [400, 90, 4], [30, 550, 550]]
        let callFunction = () => {
            utils.removeEmpty(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let param1 = [[520, 30, 410], [520, 410, 320], [30, 50, 410]]
        let callFunction = () => {
            utils.removeEmpty(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let param1 = [[100, 50, 90], [380, 90, 30], [4, 400, 380]]
        let callFunction = () => {
            utils.removeEmpty(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let param1 = [[520, 410, 410], [520, 520, 380], [1, 320, 520]]
        let callFunction = () => {
            utils.removeEmpty(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let param1 = [[400, 90, 4], [400, 30, 4], [100, 50, 70]]
        let callFunction = () => {
            utils.removeEmpty(param1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            utils.removeEmpty(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("utils.ifElse", () => {
    test("0", () => {
        let callFunction = () => {
            utils.ifElse("dedicated")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            utils.ifElse("value-added")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            utils.ifElse("methodical")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            utils.ifElse("logistical")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            utils.ifElse("4th generation")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            utils.ifElse(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("utils.exec", () => {
    test("0", () => {
        let callFunction = () => {
            utils.exec("reboot neural card")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            utils.exec("generate bluetooth firewall")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            utils.exec("parse mobile firewall")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            utils.exec("transmit bluetooth bus")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            utils.exec("synthesize wireless microchip")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            utils.exec(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
