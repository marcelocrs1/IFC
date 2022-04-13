import { Intersection, Material, Mesh, Scene } from 'three';
import { IfcMesh } from 'web-ifc-three/IFC/BaseDefinitions';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { IfcComponent } from '../../../base-types';
import { IfcContext } from '../../context';

export class IfcSelection extends IfcComponent {
  mesh: Mesh | null = null;
  material?: Material;
  private selected: number;
  private modelID: number;
  private loader: IFCLoader;
  private readonly scene: Scene;

  constructor(private context: IfcContext, loader: IFCLoader, material?: Material) {
    super(context);
    this.scene = context.getScene();
    this.loader = loader;
    if (material) this.material = material;
    this.selected = -1;
    this.modelID = -1;
  }

  dispose() {
    this.mesh?.removeFromParent();
    this.mesh?.geometry.dispose();
    this.material?.dispose();
    (this.mesh as any) = null;
    (this.material as any) = null;
    (this.scene as any) = null;
    (this.loader as any) = null;
    (this.context as any) = null;
  }

  pick = async (item: Intersection, focusSelection = false) => {
    if (this.selected === item.faceIndex || item.faceIndex == null) return null;
    this.selected = item.faceIndex;
    const mesh = item.object as IfcMesh;
    const id = await this.loader.ifcManager.getExpressId(mesh.geometry, item.faceIndex);
    if (id === undefined) return null;
    this.hideSelection(mesh);
    this.modelID = mesh.modelID;
    this.newSelection([id]);
    if (focusSelection) this.focusSelection();
    return { modelID: this.modelID, id };
  };

  unpick() {
    this.mesh = null;
    this.loader.ifcManager.removeSubset(this.modelID, this.material);
  }

  pickByID = async (modelID: number, ids: number[], focusSelection = false) => {
    this.modelID = modelID;
    this.newSelection(ids);
    if (focusSelection) await this.focusSelection();
  };

  newSelection = (ids: number[]) => {
    const mesh = this.loader.ifcManager.createSubset({
      scene: this.scene,
      modelID: this.modelID,
      ids,
      removePrevious: true,
      material: this.material
    });
    if (mesh) {
      this.mesh = mesh;
      this.mesh.visible = true;
    }
  };

  hideSelection(mesh?: IfcMesh) {
    if (this.mesh && this.modelID !== undefined && this.modelID !== mesh?.modelID) {
      this.mesh.visible = false;
    }
  }

  private async focusSelection() {
    if (this.mesh) {
      await this.context.ifcCamera.targetItem(this.mesh);
    }
  }
}
