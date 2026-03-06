use reqwest;
use url::Url;
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use csv::ReaderBuilder;
use publicsuffix::List;
use ndarray::{Array2, Array1};
use linfa::prelude::*;
use linfa_logistic::LogisticRegression;
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Serialize, Deserialize, Debug)]
struct ModelMetadata {
    coefficients: Vec<f64>,
    intercept: f64,
    features: Vec<String>,
}

fn extract_features(url_str: &str) -> Vec<f64> {
    let mut features = Vec::new();
    let url = match Url::parse(url_str) {
        Ok(u) => u,
        Err(_) => return vec![0.0; 17], // Updated to 17 features
    };

    let host = url.host_str().unwrap_or("").to_lowercase();

    // 1-8. Structural features
    features.push(url_str.len() as f64);
    features.push(url_str.matches('.').count() as f64);
    features.push(url_str.matches('-').count() as f64);
    features.push(url_str.matches('@').count() as f64);
    features.push(url_str.matches('/').count() as f64);
    features.push(url_str.matches('?').count() as f64);
    features.push(url_str.matches('=').count() as f64);
    features.push(url_str.chars().filter(|c| c.is_digit(10)).count() as f64);
    
    // 9. Has IP
    let has_ip = if host.chars().all(|c| c.is_digit(10) || c == '.') && host.contains('.') { 1.0 } else { 0.0 };
    features.push(has_ip);

    // 10. Subdomain count
    features.push(host.split('.').count() as f64);

    // 11. Special keywords
    let keywords = ["login", "verify", "update", "account", "bank", "secure", "signin", "password"];
    let mut keyword_count = 0.0;
    let lower_url = url_str.to_lowercase();
    for kw in keywords {
        if lower_url.contains(kw) {
            keyword_count += 1.0;
        }
    }
    features.push(keyword_count);

    // 12. Shortened URL check
    let shorteners = ["bit.ly", "goo.gl", "tinyurl.com", "t.co"];
    let is_shortened = if shorteners.iter().any(|&s| host.contains(s)) { 1.0 } else { 0.0 };
    features.push(is_shortened);

    // --- Phase 5: Trust Signals ---
    // 13. SSL Check
    let is_https = if url.scheme() == "https" { 1.0 } else { 0.0 };
    features.push(is_https);

    // 14. Whitelist Check
    let whitelist = ["google.com", "amazon.com", "facebook.com", "apple.com", "microsoft.com"];
    let is_whitelisted = if whitelist.iter().any(|&d| host.contains(d)) { 1.0 } else { 0.0 };
    features.push(is_whitelisted);

    // --- Phase 6: DOM Traits (Mocked for trainer) ---
    // 15. hasPassword
    let has_pass = if url_str.contains("login") || url_str.contains("signin") { 1.0 } else { 0.0 };
    features.push(has_pass);
    // 16. linkMismatch
    features.push(0.0);
    // 17. formCount
    features.push(if has_pass > 0.5 { 1.0 } else { 0.0 });

    features
}

fn download_datasets() -> (Vec<Vec<f64>>, Vec<usize>) {
    println!("[PHISHGUARD] Retraining with DOM Deep Analysis...");
    
    let phish_urls = vec![
        "http://verification-paypal.com/login",
        "http://secure-update-bank.top/account",
        "http://192.168.1.1/login.php",
        "http://bit.ly/random-hack",
        "http://signin.microsft-online.com/auth"
    ];

    let legit_urls = vec![
        "https://google.com",
        "https://amazon.com",
        "https://github.com",
        "https://wikipedia.org",
        "https://apple.com"
    ];

    let mut features_list = Vec::new();
    let mut labels = Vec::new();

    for url in phish_urls {
        features_list.push(extract_features(url));
        labels.push(1);
    }

    for url in legit_urls {
        features_list.push(extract_features(url));
        labels.push(0);
    }

    let mut final_features = Vec::new();
    let mut final_labels = Vec::new();
    for _ in 0..500 {
        final_features.extend(features_list.clone());
        final_labels.extend(labels.clone());
    }

    (final_features, final_labels)
}

fn main() {
    let (features, labels) = download_datasets();
    
    let num_samples = features.len();
    let num_features = features[0].len();
    
    let x_data: Vec<f64> = features.into_iter().flatten().collect();
    let x = Array2::from_shape_vec((num_samples, num_features), x_data).unwrap();
    let y = Array1::from_shape_vec(num_samples, labels).unwrap();

    let dataset = Dataset::new(x, y);
    
    println!("[PHISHGUARD] Optimizing weights for Deep Analysis...");
    let model = LogisticRegression::default()
        .max_iterations(200)
        .fit(&dataset)
        .expect("Model training failed");

    let metadata = ModelMetadata {
        coefficients: model.params().clone().into_raw_vec(),
        intercept: 0.0,
        features: vec![
            "length".to_string(), "dots".to_string(), "hyphens".to_string(), 
            "at".to_string(), "slashes".to_string(), "questions".to_string(), 
            "equals".to_string(), "digits".to_string(), "has_ip".to_string(), 
            "subdomains".to_string(), "keywords".to_string(), "shortened".to_string(),
            "https".to_string(), "whitelisted".to_string(),
            "has_password".to_string(), "link_mismatch".to_string(), "form_count".to_string()
        ],
    };

    let json = serde_json::to_string_pretty(&metadata).unwrap();
    let mut file = File::create("model.json").expect("Failed to create model.json");
    file.write_all(json.as_bytes()).unwrap();
    
    println!("[PHISHGUARD] Success! Hybrid model.json exported.");
}
