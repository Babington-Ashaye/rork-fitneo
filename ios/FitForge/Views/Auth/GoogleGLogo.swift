import SwiftUI

/// Official Google "G" logo drawn with brand colors.
/// Matches the native Google Sign-In button mark.
struct GoogleGLogo: View {
    var size: CGFloat = 20

    private let blue = Color(red: 0x42 / 255, green: 0x85 / 255, blue: 0xF4 / 255)   // #4285F4
    private let red = Color(red: 0xEA / 255, green: 0x43 / 255, blue: 0x35 / 255)    // #EA4335
    private let yellow = Color(red: 0xFB / 255, green: 0xBC / 255, blue: 0x05 / 255) // #FBBC05
    private let green = Color(red: 0x34 / 255, green: 0xA8 / 255, blue: 0x53 / 255)  // #34A853

    var body: some View {
        Canvas { context, canvasSize in
            let w = canvasSize.width
            let h = canvasSize.height
            let center = CGPoint(x: w / 2, y: h / 2)
            let radius = min(w, h) / 2
            let innerRadius = radius * 0.42

            // Helper to build a colored arc segment of the ring.
            func arcSegment(start: Double, end: Double) -> Path {
                var p = Path()
                p.move(to: CGPoint(
                    x: center.x + cos(start * .pi / 180) * radius,
                    y: center.y + sin(start * .pi / 180) * radius
                ))
                p.addArc(center: center,
                         radius: radius,
                         startAngle: .degrees(start),
                         endAngle: .degrees(end),
                         clockwise: false)
                p.addLine(to: CGPoint(
                    x: center.x + cos(end * .pi / 180) * innerRadius,
                    y: center.y + sin(end * .pi / 180) * innerRadius
                ))
                p.addArc(center: center,
                         radius: innerRadius,
                         startAngle: .degrees(end),
                         endAngle: .degrees(start),
                         clockwise: true)
                p.closeSubpath()
                return p
            }

            // Blue arc (top-right)
            context.fill(arcSegment(start: -90, end: 0), with: .color(blue))
            // Green arc (bottom-right)
            context.fill(arcSegment(start: 0, end: 90), with: .color(green))
            // Yellow arc (bottom-left)
            context.fill(arcSegment(start: 90, end: 180), with: .color(yellow))
            // Red arc (top-left)
            context.fill(arcSegment(start: 180, end: 270), with: .color(red))

            // Horizontal blue bar of the "G" — extends from center outward.
            let barHeight = radius * 0.42
            let barRect = CGRect(
                x: center.x,
                y: center.y - barHeight / 2,
                width: radius * 1.05,
                height: barHeight
            )
            context.fill(Path(barRect), with: .color(blue))

            // Notch out the upper-right portion so the bar joins cleanly with blue arc.
            let notchRect = CGRect(
                x: center.x + innerRadius * 0.1,
                y: center.y - barHeight,
                width: radius,
                height: barHeight / 2
            )
            context.blendMode = .destinationOut
            context.fill(Path(notchRect), with: .color(.black))
            context.blendMode = .normal

            // Cut center hole (transparent) so the white button background shows through.
            context.blendMode = .destinationOut
            context.fill(
                Path(ellipseIn: CGRect(
                    x: center.x - innerRadius,
                    y: center.y - innerRadius,
                    width: innerRadius * 2,
                    height: innerRadius * 2
                )),
                with: .color(.black)
            )
            context.blendMode = .normal
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

#Preview {
    HStack(spacing: 16) {
        GoogleGLogo(size: 24)
        GoogleGLogo(size: 48)
        GoogleGLogo(size: 96)
    }
    .padding()
    .background(Color.white)
}
