# Build the project

```bash

pip install -r requirements.txt
jupyter lite build --contents content --output-dir dist

```

# Run the project

```bash

python3 -m http.server 8080 --directory dist

```
