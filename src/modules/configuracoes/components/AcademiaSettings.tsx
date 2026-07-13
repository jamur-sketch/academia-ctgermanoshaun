import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";

interface Settings {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const defaultSettings: Settings = {
  name: "CT Germano Schaun",
  phone: "",
  email: "",
  address: "",
};

export function AcademiaSettings() {
  const [settings, setSettings] = useLocalStorage<Settings>("academia:settings", defaultSettings);
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dados de contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome da academia</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Endereço</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>Salvar</Button>
          {saved && <span className="text-sm text-green-600">Salvo!</span>}
        </div>
      </CardContent>
    </Card>
  );
}
