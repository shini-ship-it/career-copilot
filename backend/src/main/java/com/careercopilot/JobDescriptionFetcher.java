package com.careercopilot;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Fetches a public job page for the local matching feature, with bounded input and SSRF guards. */
final class JobDescriptionFetcher {
    private static final int MAX_RESPONSE_BYTES = 1_000_000;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(8);
    private static final Pattern CHARSET = Pattern.compile("(?i)charset\\s*=\\s*['\\\"]?([^;\\s'\\\"]+)");
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private JobDescriptionFetcher() {}

    static String fetch(String value) {
        URI uri = validateUrl(value);
        try {
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(REQUEST_TIMEOUT)
                    .header("User-Agent", "CareerCopilotLocal/1.0 (job description reader)")
                    .header("Accept", "text/html,text/plain;q=0.9")
                    .GET()
                    .build();
            HttpResponse<InputStream> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 300 && response.statusCode() < 400) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "This posting redirects to another page. Paste the job description instead.");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "The job posting could not be fetched. Paste its description instead.");
            }
            byte[] responseBytes;
            try (InputStream stream = response.body()) {
                responseBytes = stream.readNBytes(MAX_RESPONSE_BYTES + 1);
            }
            if (responseBytes.length > MAX_RESPONSE_BYTES) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                        "This page is too large to read. Paste the job description instead.");
            }
            String contentType = response.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
            if (!contentType.contains("text/html") && !contentType.contains("text/plain")) {
                throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "This link does not provide a readable text page. Paste the job description instead.");
            }
            Charset charset = charset(response.headers().firstValue("Content-Type").orElse(""));
            String body = new String(responseBytes, charset);
            String text = contentType.contains("text/plain") ? body : htmlToText(body);
            text = text.replaceAll("\\s+", " ").trim();
            if (text.length() < 40) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Could not find readable job details on this page. Paste the job description instead.");
            }
            return text;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                    "Reading the job posting was interrupted. Paste the description instead.");
        } catch (IOException | java.util.concurrent.CompletionException | java.io.UncheckedIOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not read that job posting. Paste its description instead.");
        }
    }

    private static URI validateUrl(String value) {
        final URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid public job posting URL.");
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        String host = uri.getHost();
        if ((!scheme.equals("http") && !scheme.equals("https")) || host == null || uri.getUserInfo() != null
                || uri.getFragment() != null || (uri.getPort() != -1
                && uri.getPort() != (scheme.equals("https") ? 443 : 80))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use a public HTTP or HTTPS job posting URL on its standard port.");
        }
        String normalizedHost = host.toLowerCase(Locale.ROOT);
        if (normalizedHost.equals("localhost") || normalizedHost.endsWith(".localhost")
                || normalizedHost.endsWith(".local") || normalizedHost.endsWith(".internal")) {
            throw invalidTarget();
        }
        try {
            for (InetAddress address : InetAddress.getAllByName(normalizedHost)) {
                if (!isPublicAddress(address)) throw invalidTarget();
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Could not resolve this public job posting host.");
        }
        return uri;
    }

    private static boolean isPublicAddress(InetAddress address) {
        if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                || address.isSiteLocalAddress() || address.isMulticastAddress()) return false;
        byte[] bytes = address.getAddress();
        if (address instanceof Inet4Address) {
            int a = bytes[0] & 0xff;
            int b = bytes[1] & 0xff;
            int c = bytes[2] & 0xff;
            return !(a == 0 || a == 10 || a == 127 || (a == 100 && b >= 64 && b <= 127)
                    || (a == 169 && b == 254) || (a == 172 && b >= 16 && b <= 31)
                    || (a == 192 && (b == 0 || b == 168) && !(b == 0 && c == 9))
                    || (a == 192 && b == 88 && c == 99) || (a == 198 && (b == 18 || b == 19))
                    || (a == 198 && b == 51 && c == 100) || (a == 203 && b == 0 && c == 113) || a >= 224);
        }
        if (address instanceof Inet6Address) {
            // Globally reachable unicast addresses are in 2000::/3; exclude the documentation range.
            return (bytes[0] & 0xe0) == 0x20 && !(bytes[0] == 0x20 && bytes[1] == 0x01
                    && bytes[2] == 0x0d && bytes[3] == (byte) 0xb8);
        }
        return false;
    }

    private static ResponseStatusException invalidTarget() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "For safety, only public job posting URLs can be read.");
    }

    private static Charset charset(String contentType) {
        Matcher matcher = CHARSET.matcher(contentType);
        if (matcher.find()) {
            try { return Charset.forName(matcher.group(1)); }
            catch (IllegalArgumentException ignored) { /* use UTF-8 */ }
        }
        return StandardCharsets.UTF_8;
    }

    private static String htmlToText(String html) throws IOException {
        StringBuilder output = new StringBuilder();
        final class Handler extends javax.swing.text.html.HTMLEditorKit.ParserCallback {
            private int ignoredDepth;
            private boolean ignored(String tag) { return tag.equals("script") || tag.equals("style") || tag.equals("noscript"); }
            @Override public void handleStartTag(javax.swing.text.html.HTML.Tag tag, javax.swing.text.MutableAttributeSet attrs, int pos) {
                String name = tag.toString().toLowerCase(Locale.ROOT);
                if (ignored(name)) ignoredDepth++;
                else if (ignoredDepth == 0 && (name.equals("p") || name.equals("div") || name.equals("br")
                        || name.equals("li") || name.matches("h[1-6]"))) output.append(' ');
            }
            @Override public void handleEndTag(javax.swing.text.html.HTML.Tag tag, int pos) {
                String name = tag.toString().toLowerCase(Locale.ROOT);
                if (ignored(name) && ignoredDepth > 0) ignoredDepth--;
                else if (ignoredDepth == 0) output.append(' ');
            }
            @Override public void handleSimpleTag(javax.swing.text.html.HTML.Tag tag, javax.swing.text.MutableAttributeSet attrs, int pos) {
                if (ignoredDepth == 0 && tag.toString().equalsIgnoreCase("br")) output.append(' ');
            }
            @Override public void handleText(char[] data, int pos) {
                if (ignoredDepth == 0) output.append(data).append(' ');
            }
        }
        new javax.swing.text.html.parser.ParserDelegator().parse(new StringReader(html), new Handler(), true);
        return output.toString();
    }
}
