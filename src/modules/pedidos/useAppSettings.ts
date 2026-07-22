import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

// Configuração compartilhada por chave (ex: order_pix).
export function useAppSetting(key: string) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).limit(1);
    if (data && data[0]) setValue((data[0].value as string) ?? "");
    setLoading(false);
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (v: string) => {
    setValue(v);
    const { error } = await supabase.from("app_settings").upsert({ key, value: v });
    if (error) console.error("[appSettings] save:", error.message);
  };

  return { value, loading, save };
}
