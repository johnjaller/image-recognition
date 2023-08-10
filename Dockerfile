FROM node:20-alpine3.17 as builder

COPY /frontend/package.json .

COPY /frontend/yarn.lock .

RUN yarn install

RUN yarn build

FROM python:3.10.12-slim-bookworm

COPY backend .

COPY COPY --from=builder /build dist/

EXPOSE 5000

CMD gunicorn --worker-class gevent --workers 8 --bind 0.0.0.0:5000 wsgi:app --max-requests 10000 --timeout 5 --keep-alive 5 --log-level info