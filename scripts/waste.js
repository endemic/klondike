class Waste extends Stack {
  type = 'waste';

  offset = 0;

  constructor() {
    super();

    this.element = document.createElement('img');
    this.element.classList.add('waste');
    this.element.src = 'images/other/waste.png';
  }

  get size() {
    return {
      width: this.width,
      height: this.height
    };
  }

  set size({width, height}) {
    this.width = width;
    this.height = height;

    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;

    console.log(`setting ${this.type} size: ${width}, ${height}`);
  }
}
