#include <iostream>
#include <cstdlib>
#include <curl/curl.h>

int main() {
	CURL *curl = curl_easy_init();
	if (!curl) return 1;

	curl_easy_setopt(curl, CURLOPT_URL, "https://www.tiktok.com/d/1/ZP9NBKEABLNvj-yJJMq/");
	curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
	curl_easy_setopt(curl, CURLOPT_NOBODY, 1L);

	curl_easy_perform(curl);

	char *final_url;
	curl_easy_getinfo(curl, CURLINFO_EFFECTIVE_URL, &final_url);

	std::string cmd = "open -na \"Google Chrome\" --args --incognito --new-tab \"" + std::string(final_url) + "\"";
	system(cmd.c_str());

	curl_easy_cleanup(curl);
	return 0;
}