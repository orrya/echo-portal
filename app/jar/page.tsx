// app/jar/page.tsx
import { EchoJarClient } from '@/components/echojar/EchoJarClient';

export const metadata = {
  title: 'EchoJar – Your quiet timeline',
};

export default function JarPage() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <EchoJarClient />
      </div>
    </main>
  );
}
