import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { AcademiaSettings } from "./components/AcademiaSettings";
import { InstructorsSettings } from "./components/InstructorsSettings";
import { UsersSettings } from "./components/UsersSettings";
import { AccountSettings } from "./components/AccountSettings";

export default function Configuracoes() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da academia, usuários e conta</p>
      </div>

      <Tabs defaultValue="academia">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList>
            <TabsTrigger value="academia">Academia</TabsTrigger>
            <TabsTrigger value="instrutores">Instrutores</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="conta">Minha conta</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="academia" className="mt-6">
          <AcademiaSettings />
        </TabsContent>
        <TabsContent value="instrutores" className="mt-6">
          <InstructorsSettings />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-6">
          <UsersSettings />
        </TabsContent>
        <TabsContent value="conta" className="mt-6">
          <AccountSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
