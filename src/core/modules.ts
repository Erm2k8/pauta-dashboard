import type { IconName } from "@/ui/icons";
import { manifest as branches } from "@/modules/branches/manifest";
import { manifest as contexts } from "@/modules/contexts/manifest";
import { manifest as tasks } from "@/modules/tasks/manifest";
import { manifest as today } from "@/modules/today/manifest";

export interface ModuleManifest {
  id: string;
  title: string;
  href: string;
  icon: IconName;
  /** Rodapé da sidebar (configuração) em vez da navegação principal. */
  footer?: boolean;
}

/** Registro de módulos — a sidebar é montada a partir daqui. Novo módulo = nova pasta + uma linha. */
export const modules: ModuleManifest[] = [today, tasks, branches, { ...contexts, footer: true }];
