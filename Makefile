BINARY   := bcc-bins
IMAGE    := bcc-bins
PORT     ?= 8080

.PHONY: all build run test clean \
        frontend-install frontend-dev frontend-build \
        docker-build docker-run

all: build

## Go API ─────────────────────────────────────────────────────────────────────

build:
	go build -o $(BINARY) .

run:
	go run .

test:
	go test ./...

clean:
	rm -f $(BINARY)

## Frontend ───────────────────────────────────────────────────────────────────

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

## Docker ─────────────────────────────────────────────────────────────────────

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run -p $(PORT):8080 $(IMAGE)
