import { db } from '@/api/db';
import { buildBackup, parseBackup, backupFileName } from '@/domain/backup';

// Exporta todos os dados. No iPhone abre a folha de compartilhamento (salvar em Arquivos/iCloud);
// sem suporte a compartilhar arquivos, faz download.
export async function exportBackup() {
  const now = new Date();
  const json = JSON.stringify(buildBackup(await db.exportAll(), now), null, 2);
  const file = new File([json], backupFileName(now), { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup do Fizza' });
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      throw error;
    }
    await db.setMeta('last_backup_at', now.toISOString());
    return 'shared';
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  await db.setMeta('last_backup_at', now.toISOString());
  return 'downloaded';
}

const readText = (file) =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

export async function readBackupFile(file) {
  try {
    return parseBackup(await readText(file));
  } catch {
    return parseBackup('');
  }
}
