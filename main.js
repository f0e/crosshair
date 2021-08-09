const canvasSize = [3840, 2160]; // 4k

const canvas = document.querySelector('#c');
canvas.imageSmoothingEnabled = false;

let vars = {};

class Control {
  updateValue() {}

  setValue(newValue) {
    vars[this.name] = newValue;
    setTimeout(() => {
      zoom();
      render();
      save();
    }, 0);
  }

  getValue() {
    return vars[this.name] ? vars[this.name] : this.options.defaultValue;
  }

  createElement() {
    const controlsElem = document.querySelector('#controls');

    const container = document.createElement('div');
    container.id = `${this.name}-container`;
    controlsElem.appendChild(container);

    switch (this.type) {
      case 'checkbox': {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = this.name;
        input.checked = this.getValue();
        container.appendChild(input);

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = this.name;
        container.insertBefore(label, input);

        // update variables
        const updateValue = () => {
          this.setValue(input.checked);
        };

        input.addEventListener('change', updateValue);
        input.addEventListener('input', updateValue);
        updateValue();

        break;
      }
      case 'number': {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = this.options.min;
        input.max = this.options.max;
        input.id = this.name;
        input.value = this.getValue();
        container.appendChild(input);

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = this.name;
        container.insertBefore(label, input);

        // update variables
        const updateValue = () => {
          this.setValue(parseFloat(input.value));
        };

        input.addEventListener('change', updateValue);
        input.addEventListener('input', updateValue);
        updateValue();

        break;
      }
      case 'dropdown': {
        const select = document.createElement('select');
        select.id = this.name;
        container.appendChild(select);

        for (const item of this.options.items) {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          select.appendChild(option);
        }

        select.value = this.getValue();

        const label = document.createElement('label');
        label.htmlFor = select.id;
        label.textContent = this.name;
        container.insertBefore(label, select);

        // update variables
        const updateValue = () => {
          this.setValue(select.value);
        };

        select.addEventListener('change', updateValue);
        updateValue();

        break;
      }
      case 'colour': {
        const input = document.createElement('input');
        input.id = this.name;
        input.value = this.getValue();
        input.setAttribute('data-jscolor', '');
        container.appendChild(input);

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = this.name;
        container.insertBefore(label, input);

        // update variables
        const updateValue = () => {
          this.setValue(input.value);
        };

        input.addEventListener('change', updateValue);
        input.addEventListener('input', updateValue);
        updateValue();

        break;
      }
      case 'image': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';
        input.id = this.name;
        container.appendChild(input);

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = this.name;
        container.insertBefore(label, input);

        // update variables
        const updateValue = (e) => {
          const reader = new FileReader();
          reader.addEventListener('load', (e) => {
            this.setValue(e.target.result);
          });
          reader.readAsDataURL(input.files[0]);

          setTimeout(render, 0);
        };

        input.addEventListener('change', updateValue);

        break;
      }
    }
  }

  constructor(name, type, options) {
    this.name = name;
    this.type = type;
    this.options = options;

    this.createElement();
  }
}

function zoom() {
  const goalHeight = 1080;
  const padding = 50;

  const height =
    goalHeight * (vars['zoom'] * (window.innerHeight / goalHeight)) - padding;
  canvas.style.width = `${(height / 9) * 16}px`;
  canvas.style.height = `${height}px`;

  const [x, y] = vars['aspect ratio'].split(':');
  console.log(x, y);
  canvas.width = (canvasSize[1] / y) * x;
  canvas.height = canvasSize[1];

  canvas.style.backgroundSize = `${
    100 + (1 - canvas.width / canvasSize[0]) * 100
  }% ${(canvas.height / canvasSize[1]) * 100}%`;
}

function render() {
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = [canvas.width / 2, canvas.height / 2];

  const fillRect = (x, y, w, h, colour) => {
    if (vars['sharp']) {
      if (!Number.isInteger(x)) x = Math.round(x);
      if (!Number.isInteger(y)) y = Math.round(y);
    }

    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
  };

  // x
  fillRect(
    center[0] - vars['length'] - vars['gap'],
    center[1] - vars['thickness'] / 2,
    vars['length'],
    vars['thickness'],
    vars['colour']
  );

  fillRect(
    center[0] + vars['gap'],
    center[1] - vars['thickness'] / 2,
    vars['length'],
    vars['thickness'],
    vars['colour']
  );

  // y
  fillRect(
    center[0] - vars['thickness'] / 2,
    center[1] - vars['length'] - vars['gap'],
    vars['thickness'],
    vars['length'],
    vars['colour']
  );

  fillRect(
    center[0] - vars['thickness'] / 2,
    center[1] + vars['gap'],
    vars['thickness'],
    vars['length'],
    vars['colour']
  );

  // background image
  if (vars['image']) {
    document.querySelector(
      '#c'
    ).style.backgroundImage = `url(${vars['image']})`;
  }
}

function save() {
  localStorage.setItem('crosshair-vars', JSON.stringify(vars));
}

function load() {
  const jsonData = localStorage.getItem('crosshair-vars');
  if (jsonData) vars = JSON.parse(jsonData);
}

load();

new Control('thickness', 'number', { min: 1, max: 100, defaultValue: 5 });
new Control('gap', 'number', { min: -100, max: 100, defaultValue: 25 });
new Control('length', 'number', { min: 1, max: 100, defaultValue: 15 });
new Control('colour', 'colour', { defaultValue: '#00FF00' });
new Control('sharp', 'checkbox', { defaultValue: true });
new Control('aspect ratio', 'dropdown', {
  items: ['16:9', '4:3', '16:10'],
  defaultValue: '16:9',
});

new Control('image', 'image');
new Control('zoom', 'number', { min: 1, max: 10, defaultValue: 1 });

window.addEventListener('resize', zoom);
