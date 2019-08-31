FROM python:3.7-alpine

Expose 8000
WORKDIR /app

RUN pip install poetry
copy ./pyproject.toml ./poetry.lock /app/
RUN poetry install

ADD . /app

CMD ["poetry", "run", "gunicorn", "-w", "4", "--bind", "0.0.0.0:8000", "ascmonitor.app:app"]
