import dynamic from 'next/dynamic';

const HhxArchitecture = dynamic(() => import('../components/HhxArchitecture'), { ssr: false });

export default function Home() {
  return <HhxArchitecture />;
}
