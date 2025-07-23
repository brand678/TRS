export class TestModule {
    constructor(element) {
        console.log("🧪 [TestModule] Module created successfully!", element);
        this.element = element;
        this.init();
    }

    init() {
        console.log("🧪 [TestModule] Module initialized!");
        this.element.style.border = "2px solid green";
        this.element.innerHTML = "✅ Module System Working!";
    }

    start() {
        console.log("🧪 [TestModule] Module started!");
    }

    stop() {
        console.log("🧪 [TestModule] Module stopped!");
    }
}
