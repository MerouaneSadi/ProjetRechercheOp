package fr.efrei.ro.transport.io;

import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class TraceWriter {
    private final StringBuilder sb = new StringBuilder();

    public void line(String s) {
        sb.append(s).append("\n");
    }

    public void blank() {
        sb.append("\n");
    }

    public void block(String s) {
        sb.append(s).append("\n");
    }

    public String text() {
        return sb.toString();
    }

    public void writeTo(Path out) throws Exception {
        if (out.getParent() != null) Files.createDirectories(out.getParent());
        try (PrintWriter pw = new PrintWriter(Files.newBufferedWriter(out, StandardCharsets.UTF_8))) {
            pw.print(sb);
        }
    }
}

