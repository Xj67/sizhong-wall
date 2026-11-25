FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CAMPUS_INVITE=SIZHONG2027

WORKDIR /app

COPY server.py wsgi.py ./
COPY web ./web

RUN mkdir -p /app/data

EXPOSE 8787

CMD ["python", "server.py"]
