import React from 'react';

// Versión ligera de AnimatedBackground: blobs suaves y movimientos sutiles.
// Diseñada para ser poco intrusiva y respetar prefers-reduced-motion.
const AnimatedBackground = () => {
	return (
		<div aria-hidden className="animated-bg fixed inset-0 -z-10 pointer-events-none">
			<div className="blob blob-1" />
			<div className="blob blob-2" />
			<style>{`
				.animated-bg { will-change: transform, opacity; }
				.blob { position: absolute; border-radius: 9999px; filter: blur(36px); opacity: .9; transform: translateZ(0); }
				.blob-1 { width: 420px; height: 420px; left: 6%; top: 8%; background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.95), rgba(99,102,241,0.7)); animation: blobFloat1 9s ease-in-out infinite; }
				.blob-2 { width: 360px; height: 360px; right: 4%; bottom: 6%; background: radial-gradient(circle at 70% 70%, rgba(236,72,153,0.95), rgba(139,92,246,0.6)); animation: blobFloat2 11s ease-in-out infinite; }

				@keyframes blobFloat1 { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.03); } 100% { transform: translateY(0) scale(1); } }
				@keyframes blobFloat2 { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(16px) scale(.98); } 100% { transform: translateY(0) scale(1); } }

				/* Respeta preferencia de reducir movimiento */
				@media (prefers-reduced-motion: reduce) {
					.blob { animation: none !important; }
				}
			`}</style>
		</div>
	);
};

export default AnimatedBackground;
