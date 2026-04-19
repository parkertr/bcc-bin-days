# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bcc-bins .

# Runtime stage — minimal image
FROM scratch
COPY --from=builder /app/bcc-bins /bcc-bins
COPY --from=builder /usr/local/go/lib/time/zoneinfo.zip /
ENV ZONEINFO=/zoneinfo.zip
EXPOSE 8080
ENTRYPOINT ["/bcc-bins"]
