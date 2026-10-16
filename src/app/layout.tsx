import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
	title: 'Korala integration examples',
	description:
		'Working Next.js examples for embedded signing, PDF template preparation, multiple signers, and signing packets.',
};
export default function Layout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
