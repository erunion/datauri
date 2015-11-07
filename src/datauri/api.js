import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import mimer from 'mimer';
import getDimensions from 'image-size';
import uri from './template/uri';
import css from './template/css';

const existsSync = fs.existsSync;
const exists = fs.exists;

class Api extends EventEmitter {
  constructor() {
    super();
  }

  format(fileName, fileContent) {
    fileContent = (fileContent instanceof Buffer) ? fileContent : new Buffer(fileContent);
    this.fileName = fileName;
    this.base64 = fileContent.toString('base64');
    this.mimetype = mimer(fileName);
    this.content = uri({
      base64: this.base64,
      mimetype: this.mimetype
    });

    return this;
  }

  encode(fileName, handler) {
    return this.async(fileName, (err) => {
      if (handler) {
        if (err) {
          return handler(err);
        }

        handler.call(this, null, this.content, this);

        return this;
      }

      if (err) {
        this.emit('error', err);

        return this;
      }

      this.emit('encoded', this.content, this);
    });
  }

  encodeSync(fileName) {
    if (!fileName || !fileName.trim || fileName.trim() === '') {
      throw new Error('Insert a File path as string argument');
    }

    if (existsSync(fileName)) {
      let fileContent = fs.readFileSync(fileName);

      return this.format(fileName, fileContent).content;
    }

    throw new Error(`The file ${fileName} was not found!`);
  }

  async(fileName, handler) {
    exists(fileName, () => {
      fs.readFile(fileName, (err, fileContent) => {
        if (err) {
          return handler.call(this, err);
        }

        handler.call(this.format(fileName, fileContent));
      });
    });
  }

  getCSS(config={}) {
    if (!this.content) {
      throw new Error('Create a data-uri config using the method encodeSync');
    }

    config.class = config.class || path.basename(this.fileName, path.extname(this.fileName));
    config.background = this.content;

    if (config.width || config.height || config['background-size']) {
      config.dimensions = getDimensions(this.fileName);
    }

    return css(config);
  }
}

export default Api;