import { Camera, Color, Vector2, WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { IfcComponent } from '../../../base-types';
import { IfcPostproduction } from './postproduction';
import { IfcContext } from '../context';

export interface RendererAPI {
  domElement: HTMLElement;

  render(...args: any): void;

  setSize(width: number, height: number): void;
}

export class IfcRenderer extends IfcComponent {
  basicRenderer = new WebGLRenderer({ antialias: true });
  renderer2D = new CSS2DRenderer();
  postProductionRenderer: IfcPostproduction;
  renderer: RendererAPI = this.basicRenderer;

  postProductionActive = false;

  private readonly container: HTMLElement;
  private readonly context: IfcContext;

  constructor(context: IfcContext) {
    super(context);
    this.context = context;
    this.container = context.options.container;
    this.setupRenderers();
    this.postProductionRenderer = new IfcPostproduction(
      this.context,
      this.basicRenderer.domElement
    );
    this.adjustRendererSize();
  }

  get usePostproduction() {
    return this.postProductionActive;
  }

  set usePostproduction(active: boolean) {
    if (this.postProductionActive === active) return;
    this.postProductionActive = active;
    this.renderer = active ? this.postProductionRenderer : this.basicRenderer;
    if (!active) this.restoreRendererBackgroundColor();
  }

  dispose() {
    this.basicRenderer.domElement.remove();
    this.basicRenderer.dispose();
    this.postProductionRenderer.dispose();
    (this.basicRenderer as any) = null;
    (this.renderer2D as any) = null;
    (this.postProductionRenderer as any) = null;
    (this.renderer as any) = null;
    (this.container as any) = null;
    (this.context as any) = null;
  }

  update(_delta: number) {
    const scene = this.context.getScene();
    const camera = this.context.getCamera();
    this.renderer.render(scene, camera);
    this.renderer2D.render(scene, camera);
  }

  getSize() {
    return new Vector2(
      this.basicRenderer.domElement.clientWidth,
      this.basicRenderer.domElement.clientHeight
    );
  }

  adjustRendererSize() {
    this.basicRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer2D.setSize(this.container.clientWidth, this.container.clientHeight);
    this.postProductionRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  newScreenshot(usePostproduction = false, camera?: Camera, dimensions?: Vector2) {
    const domElement = usePostproduction
      ? this.basicRenderer.domElement
      : this.postProductionRenderer.renderer.domElement;

    const previousDimensions = this.getSize();

    if (dimensions) {
      this.basicRenderer.setSize(dimensions.x, dimensions.y);
      this.context.ifcCamera.updateAspect(dimensions);
    }

    const scene = this.context.getScene();
    const cameraToRender = camera || this.context.getCamera();
    this.renderer.render(scene, cameraToRender);
    const result = domElement.toDataURL();

    if (dimensions) {
      this.basicRenderer.setSize(previousDimensions.x, previousDimensions.y);
      this.context.ifcCamera.updateAspect(previousDimensions);
    }

    return result;
  }

  private setupRenderers() {
    this.basicRenderer.localClippingEnabled = true;
    this.container.appendChild(this.basicRenderer.domElement);

    this.renderer2D.domElement.style.position = 'absolute';
    this.renderer2D.domElement.style.top = '0px';
    this.renderer2D.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer2D.domElement);
  }

  private restoreRendererBackgroundColor() {
    this.basicRenderer.setClearColor(new Color(0, 0, 0), 0);
  }
}
