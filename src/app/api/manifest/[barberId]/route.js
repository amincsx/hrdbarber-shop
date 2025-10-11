// Dynamic manifest generator for each barber
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const { barberId } = resolvedParams;
        
        const decodedBarberId = decodeURIComponent(barberId);
        
        // Create barber-specific manifest
        const manifest = {
            name: `داشبورد ${decodedBarberId} - آرایشگاه HRD`,
            short_name: `${decodedBarberId} - HRD`,
            description: `پنل مدیریت رزروها برای ${decodedBarberId}`,
            start_url: `/barber-dashboard/${encodeURIComponent(decodedBarberId)}?pwa=1`,
            display: "standalone",
            background_color: "#1e293b",
            theme_color: "#f59e0b",
            orientation: "portrait-primary",
            lang: "fa",
            dir: "rtl",
            scope: "/",
            icons: [
                {
                    src: "/icon-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: "/icon-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: "/apple-touch-icon.png",
                    sizes: "180x180",
                    type: "image/png",
                    purpose: "any"
                }
            ],
            categories: ["business", "productivity"],
            shortcuts: [
                {
                    name: "داشبورد من",
                    short_name: "داشبورد",
                    description: "مشاهده رزروها و اعلان‌ها",
                    url: `/barber-dashboard/${encodeURIComponent(decodedBarberId)}?pwa=1`,
                    icons: [
                        {
                            src: "/icon-192x192.png",
                            sizes: "192x192",
                            type: "image/png"
                        }
                    ]
                }
            ],
            display_override: ["standalone", "minimal-ui"]
        };

        return new NextResponse(JSON.stringify(manifest, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=0, must-revalidate',
            },
        });

    } catch (error) {
        console.error('Manifest generation error:', error);
        return NextResponse.json(
            { error: 'خطا در تولید manifest' },
            { status: 500 }
        );
    }
}

